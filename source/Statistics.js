
import _ from './birddash';

export const RESOURCE = {
  RECENT_VISITS_SUMMARY: 'RECENT_VISITS_SUMMARY',
  RECENT_CHECKINS: 'RECENT_CHECKINS',
  ASSOCIATIONS: 'ASSOCIATIONS',
};

export const DURATION = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 60 * 60 * 24,
  WEEK: 60 * 60 * 24 * 7,
  MONTH: 60 * 60 * 24 * 30,
  YEAR: 60 * 60 * 24 * 365,
  LIFETIME: Infinity,
};

export class Statistics {

  constructor(clock) {
    this.birds = [];
    this.feeders = [];
    this.visits = [];
    this.clock = clock;
  }

  add(name, list) {
    if (name === 'FEEDERS') {
      this.addFeeders(list);
    } else if (name === 'BIRDS') {
      this.addBirds(list);
    } else if (name === 'VISITS') {
      this.addVisits(list);
    }
  }

  addBirds(birds) {
    this.birds = _.uniq(this.birds.concat(birds));
  }

  addFeeders(feeders) {
    this.feeders = _.uniq(this.feeders.concat(feeders));
  }

  addVisits(visits) {
    this.visits = this.visits.concat(visits);
    this.visits.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });
  }

  computeVisitsForPopulation(duration, step) {
    const now = this.clock.timestamp;
    const oldestUnixTimestampAllowed = this.computeOldestAllowedTimestamp(duration);
    const group = this.generateTimeSlots(oldestUnixTimestampAllowed, now, step);
    const ye = _(this.visits)
      .filterByTimestampsOlderThan(oldestUnixTimestampAllowed)
      .countByTimestampStep(step)
      .value();
    return _.merge(group, ye);
  }

  computeGOUP(timestamp, step) {
    return Math.floor(timestamp / step) * step;
  }

  generateTimeSlots(start, stop, step) {
    const timestamps = _.range(start, stop);
    const slots = {};
    _.each(timestamps, (t) => {
      const x = this.computeGOUP(t, step);
      slots[x] = 0;
    });
    return slots;
  }

  computeMovementsForIndividual(id) {
    const locations = _.zero(this.birds);

    const movements = {};
    const selectedVisits = _.filterByBird(this.visits, id);

    _.each(selectedVisits, (visit) => {
      const bird = visit.bird;
      if (!locations[bird]) {
        locations[bird] = visit.feeder;
      } else if (locations[bird] === visit.feeder) {
        // do nothing
      } else {
        let start = locations[bird];
        let end = visit.feeder;
        let path = [start, end];
        let count = _.get(movements, path, 0);
        count++;
        _.set(movements, path, count);

        path = [end, start];
        count = _.get(movements, path, 0);
        count++;
        _.set(movements, path, count);

        locations[bird] = visit.feeder;
      }
    });
    return movements;
  }

  computeVisitsByFeederForIndividual(id) {
    return _(this.visits)
      .filterByBird(id)
      .countByFeeder()
      .value();
  }

  computeVisitsByFeederForPopulation(duration) {
    return _(this.visits)
      .filterByTimestampsOlderThan(this.computeOldestAllowedTimestamp(duration))
      .countByFeeder()
      .value();
  }

  computeOldestAllowedTimestamp(duration) {
    const EXCLUSIVE_INCLUDE = 1;
    return this.clock.timestamp - duration + EXCLUSIVE_INCLUDE;
  }

  getTotalVisits() {
    return this.visits.length;
  }
  
}
