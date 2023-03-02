variable "region" {
  type = string
}

variable "dist_folder" {
  type    = string
  default = "../dist"
}

variable "runtime" {
  type    = string
  default = "nodejs18.x"
}
