variable "region" {
  type = string
}

variable "dist_folder" {
  type    = string
  default = "../dist"
}

variable "src_folder" {
  type    = string
  default = "../src"
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "mongodb_public_key" {
  type = string
}

variable "mongodb_private_key" {
  type = string
}
