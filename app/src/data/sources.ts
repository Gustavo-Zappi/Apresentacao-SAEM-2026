export const SOURCES = {
  mutua: { label: 'Mútua (2023) · RAIS 2019', url: 'https://confaeab.com/wp-content/uploads/2025/04/Publicacao-O-Futuro-das-Engenharias-no-Brasil-2023-07-25-12h44.pdf' },
  febraban: { label: 'Febraban (2026)', url: 'https://portal.febraban.org.br/noticia/4490/pt-br/' },
  brasscom: { label: 'Brasscom (2026)', url: 'https://brasscom.org.br/wp-content/uploads/2026/07/Relatorio-Perspectivas-do-Mercado-de-Trabalho-Apresentacao-v9.pdf' },

  harari: { label: 'Harari · Nexus (2024)', url: 'https://www.ynharari.com/book/nexus/' },
  autor: { label: 'David Autor · NBER (2024)', url: 'https://www.nber.org/papers/w32140' },
  tasks: { label: 'Acemoglu e Restrepo · JEP (2019)', url: 'https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3' },
  jcurve: { label: 'Brynjolfsson, Rock e Syverson · AEJ (2021)', url: 'https://www.aeaweb.org/articles?id=10.1257/mac.20180386' },
  work: { label: 'Brynjolfsson, Li e Raymond · QJE (2025)', url: 'https://academic.oup.com/qje/article/140/2/889/7990658' },
  nasa: { label: 'NASA · ST5 (2006)', url: 'https://ntrs.nasa.gov/citations/20060024675' },
  airbus: { label: 'Airbus · partição biônica', url: 'https://www.airbus.com/en/newsroom/news/2016-03-pioneering-bionic-3d-printing' },
  gaussian: { label: 'Kerbl et al. · SIGGRAPH (2023)', url: 'https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/' },
  trellis: { label: 'Microsoft · TRELLIS.2', url: 'https://github.com/microsoft/TRELLIS.2' },
  simai: { label: 'Ansys · anúncio do SimAI (2024)', url: 'https://www.ansys.com/news-center/press-releases/1-9-24-ansys-launches-simai' },
  openai: { label: 'OpenAI · anúncio (08/09/2026)', url: 'https://openai.com/index/navier-stokes-solution/' },
  clay: { label: 'Clay · comunicado (11/09/2026)', url: 'https://www.claymath.org/news/navier-stokes-announcement/' },
  pump: { label: 'KSB · curvas características', url: 'https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/characteristic-curve-1117926' },
  operating: { label: 'KSB · ponto de operação', url: 'https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/operating-point-1117036' },
}
export type SourceId = keyof typeof SOURCES
