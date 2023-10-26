from mrc_framework import *
import argparse

def parseArgs():
    """
    Parse the command-line arguments.

    Returns:
        dict: The dictionary of command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Run riot command and export file to GCS")
    parser.add_argument("-i", "--hostip", help="Redis host", required=True)
    parser.add_argument("-p", "--port", help="Redis port", required=True)
    parser.add_argument("-c", "--clustername", help="Cluster name", required=True)
    parser.add_argument("-pass", "--password", default="",help="Password ", required=False)
    parser.add_argument("-b", "--bucket", help="GCS bucket name", required=True)
    
    args = parser.parse_args()
    return args


if __name__ == "__main__":
    
    """
    The main function.

    This function parses the command-line arguments and then runs the riot command to export the Redis cluster data to a GCS bucket.
    """

    args = parseArgs()
    cluster = redisCluster(host=args.hostip, port=args.port, password="")
    write_log(f"host: {args.hostip}, port: {args.port}, cluster: {args.clustername}, bucket: {args.bucket}")
    
    cluster.backup_cluster(args.clustername, args.bucket)

