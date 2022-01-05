const documents = require('./documents')
const projects = require('./projects')

/** Composition d'un dossier
 * [OK] Une CNI
 * [OK] 3 avis d'impositions si salarié, 5 sinon (valable pour le couple si marié)
 * [OK] 3 bulletins de salaires si marié
 * [OK] 1 livret de famille si marié
 * [OK] 1 compromis de vente si achat
 * [OK] 1 offre de pret + 1 amortissement si rachat
 * [OK] 2 estimations de bien si rachat
 * [OK] Ajouter un pourcentage en fonction des besoins (si rachat, certains documents ne sont pas demandés)
 * [OK] Afficher pourcentage de complétude de dossier
 * [] Tests
 */

const checkCNI = (project, documents) => {
  const errors = project.mortgagors.reduce((errs, user) => {
    const isCNI = documents.find(d => d.document === 'cni' && d.mortgagor_id === user.id && d.status === 'validé')
    return !isCNI ? [...errs, `Il manque la CNI de ${user.first_name}`] : errs
  }, [])
  return { name : 'CNI', errors, expected : project.mortgagors.length, actual : project.mortgagors.length - errors.length }
}
const getTaxNotices = (documents, id) => {
  const allUserTaxNotices = documents.filter(d => d.document === 'avis_impots' && d.status === 'validé' && d.mortgagor_id === id)
  return allUserTaxNotices.filter((t, i) => allUserTaxNotices.findIndex(e => e.year === t.year) === i)
}
const checkTaxNoticeMarried = (project, documents) => {
  const expected = project.mortgagors.some(m => m.contract && m.contract === 'salarié') ? 3 : 5
  const actual = Math.min(getTaxNotices(documents, null).length, expected)
  const errors = expected < actual ? [`Il manque ${expected - actual} avis d'imposition`] : []
  return { errors, expected, actual }
}
const checkTaxNoticeUnmarried = (project, documents) => {
  const mortgagors = project.mortgagors.map(m => ({...m, nbrTaxNotice : getTaxNotices(documents, m.id).length, nbrTaxNeeded : m.contract === 'salarié' ? 3 : 5 }))
  const errors = mortgagors.reduce((errs, user) => {
    return user.nbrTaxNotice < user.nbrTaxNeeded ? [...errs, `Il manque ${user.nbrTaxNeeded - user.nbrTaxNotice} avis d'imposition de ${user.first_name}`] : errs
  }, [])
  return { errors, expected : mortgagors.reduce((a, b) => a + b.nbrTaxNeeded, 0), actual : mortgagors.reduce((a, b) => a + b.nbrTaxNotice, 0) }
}
const checkTaxNotice = (project, documents) => {
  const arrMarried = project.mortgagors.every(m => m.civil_status && m.civil_status.startsWith('marrie'))
  const errs = arrMarried ? checkTaxNoticeMarried(project, documents) : checkTaxNoticeUnmarried(project, documents)
  return { name : 'TaxNotice', ...errs }
}
const getSalaries = (documents, id) => {
  const allUserSalaries = documents.filter(d => d.document === 'bulletins_salaire' && d.status === 'validé' && d.mortgagor_id === id)
  return allUserSalaries.filter((t, i) => allUserSalaries.findIndex(e => e.year === t.year && e.mois === t.mois) === i)
}
const checkSalary = (project, documents) => {
  const mortgagors = project.mortgagors.map(m => ({...m, nbrSalaries : getSalaries(documents, m.id).length, nbrSalariesNeeded : m.contract === 'salarié' ? 3 : 0 }))
  const errors = mortgagors.reduce((errs, user) => {
    return user.contract === 'salarié' && user.nbrSalaries < 3 ? [...errs, `Il manque ${user.nbrSalariesNeeded - user.nbrSalaries} bulletin(s) de salaires de ${user.first_name}`] : errs
  }, [])
  return { name : 'Salary', errors, expected : mortgagors.reduce((a, b) => a + b.nbrSalariesNeeded, 0), actual : mortgagors.reduce((a, b) => a + b.nbrSalaries, 0) }
}
const checkFamilyBook = (project, documents) => {
  const expected = project.mortgagors.every(m => m.civil_status && m.civil_status.startsWith('marrie')) ? 1 : 0
  const actual = Math.min(documents.filter(d => d.document === 'livret_famille' && d.status === 'validé').length, expected)
  const errors = expected > actual ? [`Il manque le livret de famille`] : []
  return { name : 'FamilyBook', errors, expected, actual }
}
const checkSellAgreement = (project, documents) => {
  const expected = project.project_kind === 'achat' ? 1 : 0
  const actual = Math.min(documents.filter(d => d.document === 'compromis_vente' && d.status === 'validé').length, expected)
  const errors = expected > actual ? [`Il manque le compromis de vente`] : []
  return { name : 'SellAgreement', errors, expected, actual }
}
const checkLendOffer = (project, documents) => {
  const expected = project.project_kind === 'rachat' ? 1 : 0
  const actualLendOffer = documents.filter(d => d.document === 'offre_pret' && d.status === 'validé').length
  const actualLendDuration = documents.filter(d => d.document === 'tableau_amortissement' && d.status === 'validé').length
  let errors = expected > actualLendOffer ? [`Il manque l'offre de prêt`] : []
  errors = expected > actualLendDuration ? [...errors, `Il manque le tableau d'amortissement`] : errors
  return { name : 'LendOffer', errors, expected : expected * 2, actual : Math.min(actualLendDuration + actualLendOffer, expected * 2) }
}
const checkEstimation = (project, documents) => {
  const expected = project.project_kind === 'rachat' ? 2 : 0
  const actual = Math.min(documents.filter(d => d.document === 'estimation_bien' && d.status === 'validé').length, expected)
  const errors = expected > actual ? [`Il manque ${expected - actual} estimation(s) de bien`] : []
  return { name : 'Estimation', errors, expected, actual }
}

const rules = [
  checkCNI,
  checkTaxNotice,
  checkSalary,
  checkFamilyBook,
  checkSellAgreement,
  checkLendOffer,
  checkEstimation
]

const makeStats = (p) => ({...p, completion : (p.rules.reduce((a, b) => a + b.actual, 0) / p.rules.reduce((a, b) => a + b.expected, 0) * 100).toFixed(2) })
const applyEachRule = (rules, project, documents) => rules.reduce((acc, rule) => [...acc, rule(project, documents)], [])
const getCasesStatus = (projects, documents) => 
  projects.reduce(
    (acc, project) => 
      [...acc, {
        project_id : project.id,
        rules : applyEachRule(
          rules,
          project,
          documents.filter(e => e.project_id === project.id)
        )
      }]
    , []
  ).map(makeStats)
const main = () => {
  console.log(JSON.stringify(getCasesStatus(projects, documents), null, 2))
}

if (require.main === module)
  main()

module.exports = Object.fromEntries(rules.map(e => ([e.name, e])))
