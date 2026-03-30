# Build stage
FROM rust:1.83 as builder

WORKDIR /usr/src/neptune

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Copy data files
COPY all_courses.json.9.gz ./
COPY all_courses.json ./
COPY output.json ./

# Build the application in release mode
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install OpenSSL and CA certificates (needed for HTTPS requests)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/neptune/target/release/neptune /app/neptune

# Copy data files
COPY --from=builder /usr/src/neptune/all_courses.json.9.gz /app/all_courses.json.9.gz
COPY --from=builder /usr/src/neptune/all_courses.json /app/all_courses.json
COPY --from=builder /usr/src/neptune/output.json /app/output.json

# Expose the port that neptune runs on
EXPOSE 8000

# Run the binary
CMD ["/app/neptune"]

