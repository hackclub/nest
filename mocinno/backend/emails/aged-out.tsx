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
import { barebonesBoxedTailwindConfig } from './theme';

export const subject = 'Your Nest container after Hack Club';

interface AgedOutEmailProps {
	email: string;
}

const paragraph = 'font-16 text-fg-2 mt-0 mb-4 text-left font-sans';

export const AgedOutEmail = ({ email }: AgedOutEmailProps) => (
	<Tailwind config={barebonesBoxedTailwindConfig}>
		<Html>
			<Head></Head>
			<Body className="bg-bg-2 m-0 text-center font-sans">
				<Preview>
					Let us know what you’d like to do with your Nest container by March 1st, 2027
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
										Your container after Hack Club
									</Heading>
								</Section>

								<Text className={paragraph}>
									Hello! You're receiving this email because you’re a current Nest user who’s 19 or
									older. Seeing as you’ve currently aged out of Hack Club & Nest resources are
									limited, we can’t indefinitely provide support for your container. Going forward,
									you have two options:
								</Text>

								<Text className={`${paragraph} pl-4`}>
									1. Pay to keep your current container as long as Nest exists, covering your share
									of hosting costs ($3/mo).
									<br />
									2. Migrate off Nest before March 1st, 2027. Your container will function normally
									until then, after which your account & container will be deleted.
								</Text>

								<Text className={paragraph}>
									No matter which choice you pick, please fill out this form{' '}
									<Link
										href={`https://forms.hackclub.com/nest-alums?email=${encodeURIComponent(email)}`}
									>
										https://forms.hackclub.com/nest-alums
									</Link>{' '}
									with your pick as soon as possible. If we haven’t heard from you by March 1st,
									your container will be shut down & deleted then.
								</Text>

								<Text className={`${paragraph} mb-0`}>
									Questions or extenuating circumstances? DM me on Slack{' '}
									<Link href="https://hackclub.enterprise.slack.com/team/U08PUHSMW4V">@sahil</Link>{' '}
									or email <Link href="mailto:nest@hackclub.com">nest@hackclub.com</Link>.
								</Text>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

AgedOutEmail.PreviewProps = {
	email: 'orpheus@hackclub.com'
} satisfies AgedOutEmailProps;

export default AgedOutEmail;
