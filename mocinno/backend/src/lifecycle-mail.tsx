import { and, eq } from 'drizzle-orm';
import { render } from 'react-email';

import { db, schema } from '@/db';
import { SMTP_FROM } from '@/env';
import { getLifecycleLists } from '@/lifecycle';
import {
	normalizeEmail,
	suspendAfter,
	type LifecycleEmailKind,
	type LifecycleRow
} from '@/lifecycle-lists';
import transporter from '@/mail';
import AgedOutEmail, { subject as agedOutSubject } from '@email/aged-out';
import NeverShippedEmail, { subject as neverShippedSubject } from '@email/never-shipped';

const SEND_DELAY_MS = 1000;

const table = schema.lifecycleEmailsTable;

type LifecycleEmailJob = {
	kind: LifecycleEmailKind;
	running: boolean;
	total: number;
	sent: number;
	skipped: number;
	failed: { email: string; error: string }[];
	current: string | null;
	startedBy: string;
	startedAt: Date;
	finishedAt: Date | null;
};

let job: LifecycleEmailJob | null = null;

export const getLifecycleEmailJob = () => job;

async function renderEmail(kind: LifecycleEmailKind, sentAt: Date) {
	switch (kind) {
		case 'aged_out':
			return { subject: agedOutSubject, html: await render(<AgedOutEmail />) };
		case 'never_shipped':
			return {
				subject: neverShippedSubject,
				html: await render(<NeverShippedEmail deadline={suspendAfter(sentAt)} />)
			};
	}
}

export async function sendLifecycleTestEmail(kind: LifecycleEmailKind, to: string) {
	const { subject, html } = await renderEmail(kind, new Date());

	await transporter.sendMail({ from: SMTP_FROM, to, subject: `[TEST] ${subject}`, html });
}

async function getRecipients(kind: LifecycleEmailKind) {
	const lists = await getLifecycleLists();

	if (kind === 'never_shipped' && !lists.backfill?.startsWith('finished')) {
		throw new Error('The Unified backfill has not finished, so the never shipped list is wrong');
	}

	const rows = kind === 'aged_out' ? lists.agedOut : lists.toWarn;
	const byEmail = new Map<string, LifecycleRow>();

	for (const row of rows) {
		if (!row.email || (row.emailed && row.emailed.status !== 'failed')) continue;

		const email = normalizeEmail(row.email);
		if (!byEmail.has(email)) byEmail.set(email, row);
	}

	return [...byEmail.entries()].map(([email, row]) => ({ ...row, email }));
}

async function claim(
	kind: LifecycleEmailKind,
	row: LifecycleRow & { email: string },
	sentBy: string
) {
	const values = {
		container_id: row.containerId,
		username: row.username,
		status: 'sending',
		error: null,
		sent_by: sentBy,
		updated_at: new Date()
	};

	const claimed = await db
		.insert(table)
		.values({ email: row.email, kind, ...values })
		.onConflictDoUpdate({
			target: [table.email, table.kind],
			set: values,
			setWhere: eq(table.status, 'failed')
		})
		.returning({ email: table.email });

	return claimed.length > 0;
}

async function runLifecycleEmails(
	current: LifecycleEmailJob,
	recipients: (LifecycleRow & { email: string })[]
) {
	for (const row of recipients) {
		current.current = row.username;
		const where = and(eq(table.email, row.email), eq(table.kind, current.kind));

		if (!(await claim(current.kind, row, current.startedBy))) {
			current.skipped++;
			continue;
		}

		let delivered = false;
		try {
			const sentAt = new Date();
			const { subject, html } = await renderEmail(current.kind, sentAt);

			await transporter.sendMail({ from: SMTP_FROM, to: row.email, subject, html });
			delivered = true;
			await db
				.update(table)
				.set({ status: 'sent', sent_at: sentAt, updated_at: new Date() })
				.where(where);

			current.sent++;
		} catch (err) {
			const detail = err instanceof Error ? err.message : String(err);
			const error = delivered
				? `Email accepted by SMTP, but recording the send failed: ${detail}. Do not retry without checking delivery.`
				: detail;
			console.error(`Lifecycle email error for ${current.kind} to ${row.username}:`, error);

			// Keep the claim non-retryable if SMTP already accepted the email.
			if (!delivered) {
				await db.update(table).set({ status: 'failed', error, updated_at: new Date() }).where(where);
			}

			current.failed.push({ email: row.email, error });
		}

		await Bun.sleep(SEND_DELAY_MS);
	}
}

export async function startLifecycleEmails(kind: LifecycleEmailKind, startedBy: string) {
	if (job?.running) {
		return { success: false, message: 'Lifecycle emails are already being sent' };
	}

	const current: LifecycleEmailJob = {
		kind,
		running: true,
		total: 0,
		sent: 0,
		skipped: 0,
		failed: [],
		current: null,
		startedBy,
		startedAt: new Date(),
		finishedAt: null
	};
	job = current;

	const finish = () => {
		current.running = false;
		current.current = null;
		current.finishedAt = new Date();
	};

	let recipients;
	try {
		recipients = await getRecipients(kind);
	} catch (err) {
		finish();
		return { success: false, message: err instanceof Error ? err.message : String(err) };
	}

	current.total = recipients.length;

	runLifecycleEmails(current, recipients)
		.catch((err) => console.error('Lifecycle emails crashed:', err))
		.finally(finish);

	return { success: true, message: `Sending ${recipients.length} emails` };
}
