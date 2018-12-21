from abc import ABCMeta, abstractmethod


class DatabaseComponent:
    __metaclass__ = ABCMeta

    @abstractmethod
    def get_connection(self): pass

    @abstractmethod
    def get_cursor(self): pass
