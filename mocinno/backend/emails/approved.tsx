// Email template taken from React Email official templates, 01-Barebones activation.tsx

import {
	Body,
	Button,
	CodeInline,
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
import { barebonesBoxedTailwindConfig } from './theme';

interface ApprovedEmailProps {
	username: string;
	domain: string;
	url: string;
}

export const ApprovedEmail = ({ username, url, domain }: ApprovedEmailProps) => (
	<Tailwind config={barebonesBoxedTailwindConfig}>
		<Html>
			<Head></Head>
			<Body className="bg-bg-2 m-0 text-center font-sans">
				<Preview>Your nest account {username} was approved</Preview>
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

							<Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-10 py-16 text-center">
								<Section className="mb-3">
									<Heading as="h1" className="font-28 text-fg m-0 font-sans">
										Nest account approved!
									</Heading>
								</Section>

								<Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-95 text-center font-sans">
									Your Nest account has been approved, you can login using{' '}
									<CodeInline>
										{username.toLowerCase()}@{domain}
									</CodeInline>
									<br />
									By default you have 2GB of RAM, 2 CPU cores and 16GB of storage, but you can
									request more resources{' '}
									<Link href="https://forms.hackclub.com/nest-resources">through this form</Link>
									<br />
									From the button below you can manage your ssh keys and domains
								</Text>

								<Section className="mb-6 text-center">
									<Button
										href={url}
										className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
									>
										Manage container
									</Button>
								</Section>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

ApprovedEmail.PreviewProps = {
	username: 'quetzal',
	domain: 'hackclub.app',
	url: 'https://dashboard.hackclub.app'
} satisfies ApprovedEmailProps;

export default ApprovedEmail;
