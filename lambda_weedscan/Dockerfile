# Build with lambda_weedscan as the context:
#   docker build -f lambda_weedscan/Dockerfile -t gardenwise-weedscan:test lambda_weedscan
# Run locally:
#   docker run --rm -p 8080:8080 gardenwise-weedscan:test

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt

COPY app ./app

COPY model/weedscan19_epoch_300.ort /opt/model/weedscan19_epoch_300.ort
COPY model/weedscan.json /opt/model/weedscan.json
COPY labels.json /opt/model/labels.json

ENV WEEDSCAN_MODEL_PATH=/opt/model/weedscan19_epoch_300.ort
ENV WEEDSCAN_CONFIG_PATH=/opt/model/weedscan.json
ENV WEEDSCAN_LABELS_PATH=/opt/model/labels.json
ENV PORT=8080

EXPOSE 8080

CMD ["python", "-m", "app.http_server"]
