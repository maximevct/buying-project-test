module.exports = [
  {
    id: 1,
    mortgagors: [
      { id: 1, first_name: 'Mélanie', contract: 'avocat', civil_status: 'marrie_sans_contrat' },
      { id: 2, first_name: 'Bertrand', contract: 'salarié', civil_status: 'marrie_sans_contrat' }
    ],
    project_kind: 'achat'
  },
  { id: 2, mortgagors: [{ id: 3, first_name: 'Jeanne', contract: 'salarié' }], project_kind: 'rachat' }
]