const test = require('ava')
const qlPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => qlPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(qlPages('w'), 'w@zce.me')
  t.is(qlPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
