
import * as _ from 'lodash';
import assert from 'assert';

import { Statistics, RESOURCES } from './Statistics';
import { empty, single, simple, movement, movementUnordered } from './datasets';

describe('Statistics' , () => {

  describe('POPULATION LIFETIME: visit total', () => {
    _.map([
      empty,
      single,
      simple,
    ], (dataset) => {
      testDatasetForPopulation(dataset, (statistics) => {
        assert.deepEqual(statistics.getTotalVisits(), dataset.statistics.visits.total);
      });
    });
  });

  describe('POPULATION RECENT: visits over time', () => {
    _.map([
      empty,
      single,
      simple,
    ], (dataset) => {
      testDatasetForPopulation(dataset, (statistics) => {
        const duration = dataset.config[RESOURCES.RECENT_VISITS_SUMMARY].duration;
        const grouping = dataset.config[RESOURCES.RECENT_VISITS_SUMMARY].grouping;
        const actual = statistics.computeVisitsForPopulation(duration, grouping);
        const expected = dataset.statistics.visits.grouped;
        assert.deepEqual(actual, expected);
      });
    });
  });

  describe('INDIVIDUAL LIFETIME: get feeder checkins', () => {
    _.map([
      empty,
      single,
      simple,
    ], (dataset) => {
      testDatasetForIndividuals(dataset, (statistics, id) => {
        assert.deepEqual(statistics.computeVisitsByFeederForIndividual(id), dataset.statistics.birds.checkins[id]);
      });
    });
  });

  describe('INDIVIDUAL LIFETIME: movement', () => {
    _.map([
      empty,
      movement,
      movementUnordered,
    ], (dataset) => {
      testDatasetForIndividuals(dataset, (statistics, id) => {
        assert.deepEqual(statistics.comptueMovementsForIndividual(id), dataset.statistics.birds.movements[id]);
      });
    });
  });

  describe('POPULATION RECENT: feeder checkins', () => {
    _.map([
      empty,
      single,
      simple,
    ], (dataset) => {
      testDatasetForPopulation(dataset, (statistics) => {
        assert.deepEqual(statistics.computeVisitsByFeederForPopulation(), dataset.statistics.feeders.checkins);
      });
    });
  });
});

function testDatasetForPopulation(dataset, callback) {
  it(dataset.name, () => {
    const statistics = new Statistics(dataset.config, dataset.clock);
    statistics.addBirds(dataset.birds);
    statistics.addFeeders(dataset.feeders);
    statistics.addVisits(dataset.visits);
    callback(statistics, dataset);
  });
}

function testDatasetForIndividuals(dataset, callback) {
  describe(dataset.name, () => {
    const statistics = new Statistics(dataset.config, dataset.clock);
    statistics.addBirds(dataset.birds);
    statistics.addFeeders(dataset.feeders);
    statistics.addVisits(dataset.visits);
    _.map(dataset.birds, (bird) => {
      const id = bird.id;
      it(id, () => {
        callback(statistics, id)
      });
    });
  });
}