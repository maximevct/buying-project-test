const lib = require('./index')
const assert = require('assert')

{ // CheckCNI with no documents
  const project = { id : 1, mortgagors : [{ id : 1, first_name : 'user_1', contract : 'salarié' }], project_kind : 'rachat' }
  const documents = []
  const { name, errors, expected, actual } = lib.checkCNI(project, documents)
  assert.equal(name, 'CNI')
  assert.deepEqual(errors, ['Il manque la CNI de user_1'])
  assert.equal(expected, 1)
  assert.equal(actual, 0)
}

{ // CheckCNI with no valid documents
  const project = { id : 1, mortgagors : [{ id : 1, first_name : 'user_1', contract : 'salarié' }], project_kind : 'rachat' }
  const documents = [
    { id : 1, document : 'cni', status : 'refusé', mortgagor_id : 1 },
    { id : 2, document : 'cni', status : 'validé', mortgagor_id : 2 }
  ]
  const { name, errors, expected, actual } = lib.checkCNI(project, documents)
  assert.equal(name, 'CNI')
  assert.deepEqual(errors, ['Il manque la CNI de user_1'])
  assert.equal(expected, 1)
  assert.equal(actual, 0)
}

{ // CheckCNI with valid documents
  const project = { id : 1, mortgagors : [{ id : 1, first_name : 'user_1', contract : 'salarié' }], project_kind : 'rachat' }
  const documents = [
    { id : 1, document : 'cni', status : 'refusé', mortgagor_id : 1 },
    { id : 2, document : 'cni', status : 'validé', mortgagor_id : 1 }
  ]
  const { name, errors, expected, actual } = lib.checkCNI(project, documents)
  assert.equal(name, 'CNI')
  assert.deepEqual(errors, [])
  assert.equal(expected, 1)
  assert.equal(actual, 1)
}

