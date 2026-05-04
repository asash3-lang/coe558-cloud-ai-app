terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Variables ────────────────────────────────────────────────────────────────
variable "project_id" {
  default = "manifest-bit-494908-a5"
}

variable "region" {
  default = "us-central1"
}

variable "bucket_name" {
  default = "manifest-bit-494908-a5-genai-images"
}

# ── Enable APIs ──────────────────────────────────────────────────────────────
resource "google_project_service" "run" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  service = "storage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "pubsub" {
  service = "pubsub.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "vertexai" {
  service = "aiplatform.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "apigateway" {
  service = "apigateway.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

# ── Cloud Storage Bucket ─────────────────────────────────────────────────────
resource "google_storage_bucket" "genai_images" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.genai_images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ── Pub/Sub Topic ────────────────────────────────────────────────────────────
resource "google_pubsub_topic" "genai_requests" {
  name = "genai-requests"
}

resource "google_pubsub_subscription" "genai_worker_push" {
  name  = "genai-worker-push"
  topic = google_pubsub_topic.genai_requests.name

  push_config {
    push_endpoint = "https://worker-service-${var.project_id}.us-central1.run.app/process"
    oidc_token {
      service_account_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    }
  }
}

# ── IAM Bindings ─────────────────────────────────────────────────────────────
data "google_project" "project" {}

resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# ── Outputs ──────────────────────────────────────────────────────────────────
output "project_id" {
  value = var.project_id
}

output "bucket_name" {
  value = google_storage_bucket.genai_images.name
}

output "pubsub_topic" {
  value = google_pubsub_topic.genai_requests.name
}
