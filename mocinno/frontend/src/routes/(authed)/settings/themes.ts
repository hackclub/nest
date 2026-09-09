export enum Theme {
	system = 'system',
	catppuccin_macchiato = 'catppuccin_macchiato',
	catppuccin_frappe = 'catppuccin_frappe',
	catppuccin_latte = 'catppuccin_latte',
	catppuccin_mocha = 'catppuccin_mocha',
	nord = 'nord',
	gruvbox = 'gruvbox'
}

export const themeInfo: Record<
	Theme,
	{
		name: string;
		description: string;
		class?: {
			light: string;
			dark: string;
		};
	}
> = {
	system: {
		name: 'System',
		description: "The default system theme with light and dark mode (Colton's favourite)",
		class: {
			light: '',
			dark: 'dark'
		}
	},
	catppuccin_macchiato: {
		name: 'Catppuccin Macchiato',
		description:
			"Medium contrast with gentle colors creating a soothing atmosphere. (Lara's favourite)"
	},
	catppuccin_mocha: {
		name: 'Catppuccin Mocha',
		description:
			"Darkest variant offering a cozy feeling with color-rich accents. (Cyteon and Reiden's favourites)"
	},
	catppuccin_frappe: {
		name: 'Catppuccin Frappe',
		description: 'A less vibrant alternative using subdued colors for a muted aesthetic.'
	},
	catppuccin_latte: {
		name: 'Catppuccin Latte',
		description: "Lightest theme harmoniously inverting the essence of Catppuccin's dark themes."
	},
	nord: {
		name: 'Nord',
		description:
			'An arctic, north-bluish color palette. Inspired by the beauty of the arctic, the colors reflect the cold, yet harmonious world of ice.'
	},
	gruvbox: {
		name: 'gruvbox',
		description: 'A retro groove pastel color scheme'
	}
};
