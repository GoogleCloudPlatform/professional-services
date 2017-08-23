import sys
from make_iap_request import *

if __name__ == "__main__":
	# sys.argv[1] = URL
	# sys.argv[2] = IAP Client Id
	print make_iap_request(sys.argv[1],sys.argv[2])