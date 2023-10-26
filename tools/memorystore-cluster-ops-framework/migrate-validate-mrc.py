from mrc_framework import *
import argparse

def parseArgs():
    """
    Parse the command-line arguments.

    Returns:
        dict: The dictionary of command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Redis Validation Framework")
    parser.add_argument("--sourcehost", type=str, required=True, help="Redis server host")
    parser.add_argument("--sourceport", type=int, required=True, help="Redis server port")
    parser.add_argument("--sourcepassword", type=str, default="", help="Redis server password")
    parser.add_argument("--tgthost", type=str, required=True, help="Redis server host")
    parser.add_argument("--tgtport", type=int, required=True, help="Redis server port")
    parser.add_argument("--tgtpassword", type=str, default="", help="Redis server password")
    parser.add_argument("--replication_mode", type=str, default='validate' , help="validate, fresh, incremental")
    parser.add_argument("--sampling_factor", type=float, default=0.3 , help="% of keys to sample")
    
    if args.mode not in ["incremental", "replace", "validate"]:
        print("Mode must be incremental or replace or validate")
        exit(1)
    
    if args.sampling_factor < 0 or args.sampling_factor > 1:
        print("Sampling factor must be between 0 and 1")
        exit(1)

    args = parser.parse_args()
    return args

if __name__ == '__main__':

    """
    The main function.

    This function parses the command-line arguments and then validates the data between the two Redis clusters.
    """

    args = parseArgs()
    tgt = redisCluster(host=args.tgthost, port=args.tgtport, password=args.tgtpassword)
    src = redisCluster(host=args.sourcehost, port=args.sourceport, password=args.sourcepassword)
    
    if args.replication_mode == 'replace':
        """
        If the replication type is 'replace', then delete all of the keys from the target cluster.
        """
        tgt.delAllKeys()

    if args.replication_mode != 'validate':
        """
        If the replication type is not 'validate', then replicate the data from the source cluster to the target cluster.
        """
        replicate_data(src, tgt)
    
    if validateCounts(src, tgt) == False:
        """
        If the counts of the two clusters do not match, then exit the program.
        """
        print("Source & Target counts do not match. Exiting program")
        exit(1)
    
    if deepValidate(args.sampling_factor, src, tgt) == False:
        """
        If the data in the two clusters does not match, then exit the program.
        """
        print("Source & Target data do not match. Exiting program")
        exit(1)

    


