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
  default = "nodejs18.x"
}
