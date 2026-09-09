// Email template taken from React Email official templates, 01-Barebones activation.tsx

import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Row,
	Section,
	Tailwind,
	Text
} from 'react-email';
import { barebonesBoxedTailwindConfig } from './theme';

interface RejectedEmailProps {
	username: string;
}

export const RejectedEmail = ({ username }: RejectedEmailProps) => (
	<Tailwind config={barebonesBoxedTailwindConfig}>
		<Html>
			<Head></Head>
			<Body className="bg-bg-2 m-0 text-center font-sans">
				<Preview>Your nest account {username} was rejected</Preview>
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
										Nest account rejected
									</Heading>
								</Section>

								<Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-95 text-center font-sans">
									Your Nest account was rejected, please contact the Nest team via #nest-help for
									more information
								</Text>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

RejectedEmail.PreviewProps = {
	username: 'quetzal'
} satisfies RejectedEmailProps;

export default RejectedEmail;
