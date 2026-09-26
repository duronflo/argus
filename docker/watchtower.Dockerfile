FROM containrrr/watchtower:latest AS source

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

COPY --from=source /watchtower /watchtower
COPY docker/watchtower-entrypoint.sh /watchtower-entrypoint.sh

RUN chmod +x /watchtower-entrypoint.sh

ENTRYPOINT ["/watchtower-entrypoint.sh"]
