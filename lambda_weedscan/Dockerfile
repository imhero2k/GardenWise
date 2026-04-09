# Build with this directory as context (includes model/):
#   docker build -f lambda_weedscan/Dockerfile -t weedscan-lambda:test lambda_weedscan
#
# From repo root (e.g. GardenWise):
#   docker build -f lambda_weedscan/Dockerfile -t weedscan-lambda:test lambda_weedscan
#
# Local invoke (Lambda Runtime Interface Emulator is in the base image):
#   docker run -p 9000:8080 weedscan-lambda:test
#
# Push to ECR, then create a Lambda function from the image (same architecture as build).

FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY app ${LAMBDA_TASK_ROOT}/app

COPY model/weedscan19_epoch_300.ort /opt/model/weedscan19_epoch_300.ort
COPY model/weedscan.json /opt/model/weedscan.json
COPY labels.json /opt/model/labels.json

ENV WEEDSCAN_MODEL_PATH=/opt/model/weedscan19_epoch_300.ort
ENV WEEDSCAN_CONFIG_PATH=/opt/model/weedscan.json
ENV WEEDSCAN_LABELS_PATH=/opt/model/labels.json

CMD ["app.handler.lambda_handler"]
