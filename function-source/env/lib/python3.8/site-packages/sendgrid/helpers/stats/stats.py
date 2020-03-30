class Stats(object):
    def __init__(
            self, start_date=None):
        self._start_date = None
        self._end_date = None
        self._aggregated_by = None
        self._sort_by_metric = None
        self._sort_by_direction = None
        self._limit = None
        self._offset = None

        # Minimum required for stats
        if start_date:
            self.start_date = start_date

    def __str__(self):
        return str(self.get())

    def get(self):
        """
        :return: response stats dict
        """
        stats = {}
        if self.start_date is not None:
            stats["start_date"] = self.start_date
        if self.end_date is not None:
            stats["end_date"] = self.end_date
        if self.aggregated_by is not None:
            stats["aggregated_by"] = self.aggregated_by
        if self.sort_by_metric is not None:
            stats["sort_by_metric"] = self.sort_by_metric
        if self.sort_by_direction is not None:
            stats["sort_by_direction"] = self.sort_by_direction
        if self.limit is not None:
            stats["limit"] = self.limit
        if self.offset is not None:
            stats["offset"] = self.offset
        return stats

    @property
    def start_date(self):
        return self._start_date

    @start_date.setter
    def start_date(self, value):
        self._start_date = value

    @property
    def end_date(self):
        return self._end_date

    @end_date.setter
    def end_date(self, value):
        self._end_date = value

    @property
    def aggregated_by(self):
        return self._aggregated_by

    @aggregated_by.setter
    def aggregated_by(self, value):
        self._aggregated_by = value

    @property
    def sort_by_metric(self):
        return self._sort_by_metric

    @sort_by_metric.setter
    def sort_by_metric(self, value):
        self._sort_by_metric = value

    @property
    def sort_by_direction(self):
        return self._sort_by_direction

    @sort_by_direction.setter
    def sort_by_direction(self, value):
        self._sort_by_direction = value

    @property
    def limit(self):
        return self._limit

    @limit.setter
    def limit(self, value):
        self._limit = value

    @property
    def offset(self):
        return self._offset

    @offset.setter
    def offset(self, value):
        self._offset = value


class CategoryStats(Stats):
    def __init__(self, start_date=None, categories=None):
        self._categories = None
        super(CategoryStats, self).__init__()

        # Minimum required for category stats
        if start_date and categories:
            self.start_date = start_date
            for cat_name in categories:
                self.add_category(Category(cat_name))

    def get(self):
        """
        :return: response stats dict
        """
        stats = {}
        if self.start_date is not None:
            stats["start_date"] = self.start_date
        if self.end_date is not None:
            stats["end_date"] = self.end_date
        if self.aggregated_by is not None:
            stats["aggregated_by"] = self.aggregated_by
        if self.sort_by_metric is not None:
            stats["sort_by_metric"] = self.sort_by_metric
        if self.sort_by_direction is not None:
            stats["sort_by_direction"] = self.sort_by_direction
        if self.limit is not None:
            stats["limit"] = self.limit
        if self.offset is not None:
            stats["offset"] = self.offset
        if self.categories is not None:
            stats['categories'] = [category.get() for category in
                                   self.categories]
        return stats

    @property
    def categories(self):
        return self._categories

    def add_category(self, category):
        if self._categories is None:
            self._categories = []
        self._categories.append(category)


class SubuserStats(Stats):
    def __init__(self, start_date=None, subusers=None):
        self._subusers = None
        super(SubuserStats, self).__init__()

        # Minimum required for subusers stats
        if start_date and subusers:
            self.start_date = start_date
            for subuser_name in subusers:
                self.add_subuser(Subuser(subuser_name))

    def get(self):
        """
        :return: response stats dict
        """
        stats = {}
        if self.start_date is not None:
            stats["start_date"] = self.start_date
        if self.end_date is not None:
            stats["end_date"] = self.end_date
        if self.aggregated_by is not None:
            stats["aggregated_by"] = self.aggregated_by
        if self.sort_by_metric is not None:
            stats["sort_by_metric"] = self.sort_by_metric
        if self.sort_by_direction is not None:
            stats["sort_by_direction"] = self.sort_by_direction
        if self.limit is not None:
            stats["limit"] = self.limit
        if self.offset is not None:
            stats["offset"] = self.offset
        if self.subusers is not None:
            stats['subusers'] = [subuser.get() for subuser in
                                 self.subusers]
        return stats

    @property
    def subusers(self):
        return self._subusers

    def add_subuser(self, subuser):
        if self._subusers is None:
            self._subusers = []
        self._subusers.append(subuser)


class Category(object):

    def __init__(self, name=None):
        self._name = None
        if name is not None:
            self._name = name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        self._name = value

    def get(self):
        return self.name


class Subuser(object):

    def __init__(self, name=None):
        self._name = None
        if name is not None:
            self._name = name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        self._name = value

    def get(self):
        return self.name
