import sys
from make_iap_request import *

if __name__ == "__main__":
	# sys.argv[1] = URL
	# sys.argv[2] = IAP Client Id
	make_iap_request(sys.argv[1],sys.argv[2])
	# make_iap_request(
	# 	"https://gappslabs.co",
	# 	"209762747271-knpi7rgeu1q1a8c6degjk3f4m9bsmcco.apps.googleusercontent.com")