import test from 'ava'
import Database from 'better-sqlite3'

import { MockRegistry } from '../../../src/satellite/mock'

import { electrify } from '../../../src/drivers/better-sqlite3'
import {
  _NOT_UNIQUE_,
  _RECORD_NOT_FOUND_,
} from '../../../src/client/validation/errors/messages'
import { schema } from '../generated'
import { DataTypes, Dummy } from '../generated/client'

const db = new Database(':memory:')
const electric = await electrify(
  db,
  schema,
  {
    auth: {
      token: 'test-token',
    },
  },
  { registry: new MockRegistry() }
)

const tbl = electric.db.DataTypes

// Sync all shapes such that we don't get warnings on every query
await tbl.sync()

function setupDB() {
  db.exec('DROP TABLE IF EXISTS DataTypes')
  db.exec(
    "CREATE TABLE DataTypes('id' int PRIMARY KEY, 'date' varchar, 'time' varchar, 'timetz' varchar, 'timestamp' varchar, 'timestamptz' varchar, 'relatedId' int);"
  )

  db.exec('DROP TABLE IF EXISTS Dummy')
  db.exec(
    "CREATE TABLE Dummy('id' int PRIMARY KEY, 'timestamp' varchar);"
  )
}

test.beforeEach(setupDB)

/*
 * The tests below check that the DAL correctly transforms JS objects in user input.
 */

test.serial('findFirst transforms JS objects to SQLite', async (t) => {
  const date = '2023-09-13 23:33:04.271'

  await electric.adapter.run({ sql: `INSERT INTO DataTypes('id', 'timestamp') VALUES (1, '${date}')` })

  const res = await tbl.findFirst({
    where: {
      timestamp: new Date(date)
    }
  })

  t.deepEqual(res?.timestamp, new Date(date))
})

test.serial('findFirst transforms JS objects in equals filter to SQLite', async (t) => {
  const date = '2023-09-13 23:33:04.271'

  await electric.adapter.run({ sql: `INSERT INTO DataTypes('id', 'timestamp') VALUES (1, '${date}')` })

  const res = await tbl.findFirst({
    where: {
      timestamp: {
        gt: new Date('2023-09-13 23:33:03.271')
      }
    }
  })

  /*
  // DEBUG WHY `equals` filter does not work
  const res = await tbl.findFirst({
    where: {
      timestamp: {
        equals: new Date(date)
      }
    }
  })
   */

  t.deepEqual(res?.timestamp, new Date(date))
})

test.serial('findFirst transforms JS objects in not filter to SQLite', async (t) => {
  const date1 = '2023-09-13 23:33:04.271'
  const date2 = '2023-09-12 16:04:39.034'

  await electric.adapter.run({ sql: `INSERT INTO DataTypes('id', 'timestamp') VALUES (1, '${date1}'), (2, '${date2}')` })

  const res = await tbl.findFirst({
    where: {
      timestamp: {
        not: new Date(date1)
      }
    }
  })

  t.deepEqual(res?.timestamp, new Date(date2))
})

test.serial('findFirst transforms JS objects in deeply nested filter to SQLite', async (t) => {
  const date = '2023-09-13 23:33:04.271'

  await electric.adapter.run({ sql: `INSERT INTO DataTypes('id', 'timestamp') VALUES (1, '${date}')` })

  const res = await tbl.findFirst({
    where: {
      timestamp: {
        not: {
          lte: new Date('2023-09-13 23:33:03.271')
        }
      }
    }
  })

  t.deepEqual(res?.timestamp, new Date(date))
})

test.serial('findMany transforms JS objects in `in` filter to SQLite', async (t) => {
  const date1 = '2023-09-13 23:33:04.271'
  const date2 = '2023-09-12 16:04:39.034'
  const date3 = '2023-09-11 08:19:21.827'

  await electric.adapter.run({ sql: `INSERT INTO DataTypes('id', 'timestamp') VALUES (1, '${date1}'), (2, '${date2}'), (3, '${date3}')` })

  const res = await tbl.findMany({
    where: {
      timestamp: {
        in: [
          new Date(date1),
          new Date(date2)
        ]
      }
    }
  })

  t.deepEqual(res.map(row => row.timestamp), [new Date(date1), new Date(date2)])
})

test.serial('create transforms nested JS objects to SQLite', async (t) => {
  const date1 = new Date('2023-09-13 23:33:04.271')
  const date2 = new Date('2023-09-12 23:33:04.271')

  const record = {
    id: 1,
    timestamp: date1,
    related: {
      create: {
        id: 2,
        timestamp: date2
      }
    }
  }

  const res = await tbl.create({
    data: record,
    include: {
      related: true
    }
  }) as (DataTypes & { related: Dummy })

  t.deepEqual(res.id, 1)
  t.deepEqual(res.timestamp, date1)
  t.deepEqual(res.related.id, 2)
  t.deepEqual(res.related.timestamp, date2)

  const fetchRes = await tbl.findUnique({
    where: {
      id: 1
    },
    include: {
      related: true
    }
  }) as (DataTypes & { related: Dummy })

  t.deepEqual(fetchRes.id, 1)
  t.deepEqual(fetchRes.timestamp, date1)
  t.deepEqual(fetchRes.related.id, 2)
  t.deepEqual(fetchRes.related.timestamp, date2)
})

// TODO: make timestamp column unique such that we can test findUnique by passing a timestamp in where of findUnique
// TODO: write tests for createMany, update, updateMany, upsert, delete, deleteMany
test.serial('createMany transforms JS objects to SQLite', async (t) => {
  const date1 = new Date('2023-09-13 23:33:04.271')
  const date2 = new Date('2023-09-12 23:33:04.271')

  const record1 = {
    id: 1,
    timestamp: date1,
  }

  const record2 = {
    id: 2,
    timestamp: date2
  }

  const res = await tbl.createMany({
    data: [record1, record2]
  })

  t.is(res.count, 2)

  const fetchRes = await tbl.findMany({
    where: {
      id: {
        in: [1, 2]
      }
    }
  })

  const nulls = {
    date: null,
    time: null,
    timetz: null,
    timestamp: null,
    timestamptz: null,
    relatedId: null,
  }

  t.deepEqual(fetchRes, [
    {
      ...nulls,
      ...record1
    },
    {
      ...nulls,
      ...record2
    },
  ])
})