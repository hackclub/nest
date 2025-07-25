import matplotlib.pyplot as plt
import numpy as np
from numpy.typing import NDArray


def generate_stacked_bar_chart(
    x: NDArray,
    y: NDArray,
    labels: list[str],
    text_colour: str,
    bg_colour: str,
    categories: list[str],
    colours: list[str],
    x_axis_label: str = "X",
):
    fig, ax = plt.subplots()
    bottom = np.zeros(len(x))

    for i, y_values in enumerate(y):
        bars = ax.bar(x, y_values, bottom=bottom, label=categories[i], color=colours[i])
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax.text(
                    bar.get_x() + bar.get_width() / 2.0,
                    bar.get_y() + height / 2.0,
                    f"{int(height)}",
                    ha="center",
                    va="center",
                    color=text_colour,
                    fontsize=8,
                )
        bottom += y_values

    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_facecolor(bg_colour)
    fig.patch.set_facecolor(bg_colour)
    ax.legend(title="Status", bbox_to_anchor=(1.05, 1), loc="upper left")
    plt.xlabel(x_axis_label, color=text_colour)
    plt.ylabel("Count", color=text_colour)
    ax.tick_params(colors=text_colour)
    plt.tight_layout()

    return fig
