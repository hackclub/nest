// Email template taken from React Email official templates, 01-Barebones activation.tsx

import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text
} from 'react-email';
import { barebonesBoxedTailwindConfig, formatDay } from './theme';

export const subject = 'Ship a project to keep your Nest container';

interface NeverShippedEmailProps {
	deadline: Date;
}

const paragraph = 'font-16 text-fg-2 mt-0 mb-4 text-left font-sans';

export const NeverShippedEmail = ({ deadline }: NeverShippedEmailProps) => (
	<Tailwind config={barebonesBoxedTailwindConfig}>
		<Html>
			<Head></Head>
			<Body className="bg-bg-2 m-0 text-center font-sans">
				<Preview>
					Ship a project to any Hack Club program by {formatDay(deadline)} to keep your Nest
					container
				</Preview>
				<Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-160">
					<Section>
						<Section className="bg-bg mobile:px-2 px-6 py-4">
							<Section className="mb-3 px-6">
								<Row>
									<Column className="w-1/2 py-1.75 align-middle">
										<Row>
											<Column className="w-8 align-middle">
												<Img
													src="https://hackclub.app/favicon.png"
													alt="Nest Logo"
													width={48}
													className="block"
												/>
											</Column>
										</Row>
									</Column>
									<Column align="right" className="w-1/2 py-1.75 align-middle">
										<Text className="font-13 m-0 text-right font-sans">
											<span className="text-fg-3">Nest</span>
										</Text>
									</Column>
								</Row>
							</Section>

							<Section className="bg-bg-2 mobile:px-6 mobile:py-10 rounded-[8px] px-10 py-12 text-left">
								<Section className="mb-6">
									<Heading as="h1" className="font-28 text-fg m-0 text-left font-sans">
										Ship a project to keep your container
									</Heading>
								</Section>

								<Text className={paragraph}>
									Hi folks! If you’re receiving this email, you’re a user of Nest who’s had an
									account for at least 2 months & have never shipped a project to Hack Club.
									Resources on Nest are limited, and to make sure you’re building projects with
									Nest, you’ll be required to build and ship any project to a Hack Club program to
									keep your container. In one month, on <strong>{formatDay(deadline)}</strong>, if
									you haven’t shipped a project to any program, your container will be suspended
									until you do so.
								</Text>

								<Text className={paragraph}>
									We are aware that often programs can have delayed review times - if you’re
									approaching the deadline & are unsure if you’ll be able to make it, please fill
									out this form:{' '}
									<Link href="https://forms.hackclub.com/shipped-nest">
										https://forms.hackclub.com/shipped-nest
									</Link>{' '}
									and we’ll make sure to check with the program in question.
								</Text>

								<Text className={paragraph}>
									To be clear, any project (even one not hosted on Nest 😔) counts! If you don’t
									know where you can ship a project, some great options are Crescent (a unique
									multiplier-based program) or Phantom (join an in-person escape room hackathon in
									Philadelphia!). You can find a full list at{' '}
									<Link href="https://hackclub.com/programs">hackclub.com/programs</Link>, where
									there’s many awesome programs you can join.
								</Text>

								<Text className={`${paragraph} mb-0`}>
									If you have any questions, feel free to DM me @sahil on Slack or email{' '}
									<Link href="mailto:nest@hackclub.com">nest@hackclub.com</Link>!
								</Text>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

NeverShippedEmail.PreviewProps = {
	deadline: new Date('2026-12-16')
} satisfies NeverShippedEmailProps;

export default NeverShippedEmail;
