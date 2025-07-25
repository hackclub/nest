import matplotlib.pyplot as plt
from numpy.typing import NDArray


def generate_pie_chart(
    y: NDArray, labels: list, colours: list, text_colour: str, bg_colour: str
):
    fig, ax = plt.subplots()
    result = ax.pie(
        y,
        labels=labels,
        colors=colours,
        autopct="%.1f%%",
        startangle=140,
        textprops=dict(color=text_colour),
    )

    if len(result) == 3:
        wedges, texts, autotexts = result
    else:
        wedges, texts = result
        autotexts = []

    for text in texts:
        text.set_color(text_colour)

    for autotext in autotexts:
        autotext.set_color("black")
        autotext.set_fontsize(10)

    ax.axis("equal")
    fig.patch.set_facecolor(bg_colour)

    return fig
