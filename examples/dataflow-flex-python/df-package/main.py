import logging

from corder import customer_orders

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    customer_orders.run()
