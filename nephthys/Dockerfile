FROM python:3.13-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ADD . /app

WORKDIR /app

RUN apt update
RUN apt install -y curl

RUN uv python install
RUN uv sync --frozen

EXPOSE 3000

ENV PATH="/app/.venv/bin:$PATH"

RUN prisma db push

CMD ["nephthys"]