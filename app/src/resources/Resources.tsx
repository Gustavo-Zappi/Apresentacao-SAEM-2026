import { TALK } from '../data/event'
import { CAREERS } from '../data/careers'
import { SOURCES } from '../data/sources'

export default function Resources() {
  return <main className="resources">
    <header className="resources-header"><a href="/">Participar da palestra</a><img src="/logo-4matt-branco.png" alt="4MATT" /></header>
    <article>
      <p className="resources-eyebrow">SAEM 2026 · UFJF · Gustavo Zappi · 11/11/2026</p>
      <h1>{TALK.title}</h1><p className="resources-summary">{TALK.summary}</p>
      <nav aria-label="Material de apoio"><a href="#plano">Plano de 30 dias</a><a href="#projetos">Projetos por frente</a><a href="#referencias">Referências</a><a href="/guia-saem-2026.md" download>Baixar o guia</a></nav>
      <section id="plano"><h2>Um projeto em 30 dias</h2><p>Escolha um problema pequeno de engenharia. O resultado deve permitir explicar o que a IA fez, como você avaliou a saída e onde estão seus limites.</p>
        <ol className="resources-weeks">
          <li><h3>Semana 1 · Referência</h3><p>Defina problema, dados e critério de aceitação. Resolva uma versão de referência antes de introduzir IA.</p></li>
          <li><h3>Semana 2 · Aplicação</h3><p>Use IA em uma etapa definida. Registre entradas, saídas, fontes e ferramentas.</p></li>
          <li><h3>Semana 3 · Verificação</h3><p>Teste dados ausentes, erros de unidade e condições diferentes. Compare o resultado com a referência.</p></li>
          <li><h3>Semana 4 · Demonstração</h3><p>Apresente uma demonstração e uma página com problema, comparação, limitações e decisão recomendada.</p></li>
        </ol>
      </section>
      <section id="projetos"><h2>Projetos por frente de atuação</h2><p>São sugestões formativas, sem promessa de vaga ou previsão de demanda. Essas competências podem integrar funções existentes ou novas especializações.</p>
        <div className="resources-projects">{CAREERS.map(c=><article key={c.title}><span>{c.track==='tecnologia'?'Tecnologia':'Gestão'}</span><h3>{c.title}</h3><p><strong>Entrega:</strong> {c.deliver}</p><p><strong>Sua base:</strong> {c.base}.</p><p><strong>Acrescente:</strong> {c.add}.</p><p><strong>Projeto:</strong> {c.project}</p></article>)}</div>
      </section>
      <section><h2>Sua formação abre mais caminhos</h2><p>No estudo da Mútua (2023), com RAIS 2019, setor público, serviços de arquitetura/engenharia e construção lideram entre engenheiros típicos registrados e com carteira assinada. É um recorte histórico de vínculos, sem representar todas as contratações de graduados.</p><p>A Febraban informou em 2026 que 42% dos bancos consultados pretendem ampliar TI. A Brasscom projeta cerca de 33 mil novos empregos formais no macrossetor TIC em 2026. Esses dados abrangem diferentes formações, não apenas engenharia.</p><p>Formular problemas e avaliar soluções oferece uma base para atuar com dados e IA, junto ao aprendizado de competências adicionais.</p></section>
      <section><h2>O caso da bomba</h2><p>Exemplo didático de dimensionamento preliminar: água a 20 °C, 30 m³/h, 120 m de tubo, diâmetro interno de 77,9 mm, desnível de 18 m, rugosidade de 0,045 mm, K = 8 e rendimento de 70%. A referência calcula aproximadamente 24,0 m de altura e 2,8 kW no eixo.</p><p>A seleção depende de curva do fabricante, ponto de operação, condições de sucção, NPSH e faixa de trabalho. O exemplo de 214 m de transiente usa Joukowsky com celeridade de 1.200 m/s e perda rápida de toda a velocidade. Ele não representa qualquer parada.</p><p>O cenário de recomendação de parada é hipotético. O cálculo em regime permanente não prevê uma falha do equipamento.</p><a href="/demo-bombeamento.webm">Assistir à gravação do cálculo de referência</a></section>
      <section id="referencias"><h2>Referências da palestra</h2><p>Consultadas em {TALK.checked}. As perguntas inspiradas em Harari são formulações desta palestra. Estudos e anúncios têm contextos e limites próprios.</p><ul>{Object.values(SOURCES).map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul><p>O resultado de +15% citado corresponde ao estudo de atendimento publicado em QJE em 2025. Não é um ganho esperado para engenharia. No caso de Navier–Stokes, a palestra distingue o anúncio da OpenAI do processo de avaliação do Clay.</p></section>
      <footer>Gustavo Zappi · Head of AI · 4MATT<br /><a href="/">Voltar à participação</a></footer>
    </article>
  </main>
}
