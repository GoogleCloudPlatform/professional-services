import sys
import make_iap_request as iap

if __name__ == "__main__":
	# sys.argv[1] = URL
	# sys.argv[2] = IAP Client Id
	print iap.make_iap_request(sys.argv[1],sys.argv[2])