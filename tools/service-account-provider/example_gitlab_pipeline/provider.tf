provider "google" {
    access_token = var.access_token
}

provider "google-beta" {
    access_token = var.access_token
}

variable "access_token" {
    default = null
    description="For running the automation, we use acces_token variable"
}