{ imageName }:
let
  pkgs = import (builtins.fetchTarball {
    url = "https://github.com/grahamc/nixpkgs/archive/layered-docker-images.tar.gz";
    sha256 = "05a3jjcqvcrylyy8gc79hlcp9ik9ljdbwf78hymi5b12zj2vyfh6";
  }) {};
in pkgs.dockerTools.buildLayeredImage {
  name = imageName;
  tag = "latest";
  config.Cmd = [ "${pkgs.mysql}/bin/mysqld" ];
  maxLayers = 120;
}
