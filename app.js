
// Caminhos dos arquivos JSON locais
const URL_ITENS = 'data/itens.json';
const URL_DETALHES = 'data/detalhes.json';

// Estado em memória para busca/filtragem rápida da listagem principal
let listaSuplementos = [];
let ultimoIdSelecionado = null;

// Seleção de elementos do DOM
const elListaProdutos = document.getElementById('lista-produtos');
const elLoadingCatalogo = document.getElementById('loading-catalogo');
const elErroCatalogo = document.getElementById('erro-catalogo');
const elErroCatalogoMsg = document.getElementById('erro-catalogo-msg');
const elVazioCatalogo = document.getElementById('vazio-catalogo');
const elContadorItens = document.getElementById('contador-itens');

// Elementos de Filtro e Busca
const inputBusca = document.getElementById('input-busca');
const selectCategoria = document.getElementById('select-categoria');
const btnLimpar = document.getElementById('btn-limpar');
const btnResetarBusca = document.getElementById('btn-resetar-busca');
const btnTentarNovamente = document.getElementById('btn-tentar-novamente');

// Elementos do Modal de Detalhes
const modalElement = document.getElementById('modalDetalhes');
const modalBootstrap = new bootstrap.Modal(modalElement);
const elModalTitulo = document.getElementById('modalDetalhesTitulo');
const elLoadingModal = document.getElementById('loading-modal');
const elErroModal = document.getElementById('erro-modal');
const elConteudoModal = document.getElementById('conteudo-modal');
const btnTentarModal = document.getElementById('btn-tentar-modal');

/**
 * Função utilitária para formatar valores em Real (BRL)
 */
const formatarMoeda = (valor) => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * 1. REQUISIÇÃO AJAX: Carrega a listagem inicial de suplementos (itens.json)
 */
async function carregarCatalogo() {
  // Exibe Loading Spinner e oculta outros estados
  elLoadingCatalogo.classList.remove('d-none');
  elErroCatalogo.classList.add('d-none');
  elVazioCatalogo.classList.add('d-none');
  elListaProdutos.innerHTML = '';
  elContadorItens.textContent = 'Carregando...';

  try {
    // Pequeno delay simulado (300ms) para evidenciar o Spinner em ambiente local
    await new Promise((resolve) => setTimeout(resolve, 300));

    const resposta = await fetch(URL_ITENS);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();
    listaSuplementos = dados;

    renderizarCatalogo(listaSuplementos);
  } catch (erro) {
    console.error('Erro ao buscar catálogo:', erro);
    elErroCatalogoMsg.textContent =
      'Não foi possível carregar os dados de "data/itens.json". Certifique-se de estar executando o projeto em um servidor local (ex.: Live Server).';
    elErroCatalogo.classList.remove('d-none');
    elContadorItens.textContent = 'Erro ao carregar';
  } finally {
    elLoadingCatalogo.classList.add('d-none');
  }
}

/**
 * Renderiza os cards de produtos na tela utilizando o Grid do Bootstrap 5
 */
function renderizarCatalogo(itens) {
  elListaProdutos.innerHTML = '';

  // Atualiza contador de resultados
  elContadorItens.textContent = `${itens.length} ${itens.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;

  // Verifica se a busca/filtro não retornou resultados
  if (itens.length === 0) {
    elVazioCatalogo.classList.remove('d-none');
    return;
  }

  elVazioCatalogo.classList.add('d-none');

  itens.forEach((item) => {
    const coluna = document.createElement('article');
    coluna.className = 'col';

    coluna.innerHTML = `
      <div class="card h-100 border-0 shadow-sm card-produto">
        <div class="card-img-wrapper">
          <span class="badge bg-dark text-warning badge-categoria">${item.categoria}</span>
          <img src="${item.imagem}" alt="${item.titulo}" loading="lazy">
        </div>
        <div class="card-body d-flex flex-column">
          <h3 class="h5 card-title fw-bold text-dark mb-2">${item.titulo}</h3>
          <p class="card-text text-muted small flex-grow-1">${item.resumo}</p>
          <div class="mt-3 pt-3 border-top d-flex align-items-center justify-content-between">
            <div>
              <span class="d-block small text-muted">À vista</span>
              <span class="preco-destaque">${formatarMoeda(item.preco)}</span>
            </div>
            <button 
              type="button" 
              class="btn btn-warning fw-semibold btn-detalhes" 
              data-id="${item.id}"
              aria-label="Ver detalhes nutricionais de ${item.titulo}"
            >
              <i class="bi bi-plus-circle me-1"></i>Detalhes
            </button>
          </div>
        </div>
      </div>
    `;

    elListaProdutos.appendChild(coluna);
  });
}

/**
 * Filtra os itens dinamicamente por texto e por categoria sem recarregar a página
 */
function aplicarFiltros() {
  const termoBusca = inputBusca.value.trim().toLowerCase();
  const categoriaSelecionada = selectCategoria.value;

  const itensFiltrados = listaSuplementos.filter((item) => {
    const bateTexto =
      item.titulo.toLowerCase().includes(termoBusca) ||
      item.resumo.toLowerCase().includes(termoBusca) ||
      item.categoria.toLowerCase().includes(termoBusca);

    const bateCategoria =
      categoriaSelecionada === 'Todas' || item.categoria === categoriaSelecionada;

    return bateTexto && bateCategoria;
  });

  renderizarCatalogo(itensFiltrados);
}

/**
 * 2. NOVA REQUISIÇÃO AJAX: Busca dados complementares do item selecionado (detalhes.json)
 */
async function carregarDetalhesProduto(idProduto) {
  ultimoIdSelecionado = idProduto;

  // Busca dados básicos do item já selecionado para exibir no cabeçalho
  const itemBase = listaSuplementos.find((item) => item.id === idProduto);
  elModalTitulo.textContent = itemBase ? itemBase.titulo : 'Detalhes do Suplemento';

  // Abre o Modal e exibe o estado de carregamento
  modalBootstrap.show();
  elLoadingModal.classList.remove('d-none');
  elErroModal.classList.add('d-none');
  elConteudoModal.classList.add('d-none');
  elConteudoModal.innerHTML = '';

  try {
    // Pequeno delay simulado (350ms) para demonstrar o Spinner do Modal
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Executa obrigatoriamente uma NOVA requisição AJAX para buscar detalhes complementares
    const resposta = await fetch(`${URL_DETALHES}?id=${idProduto}`);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const listaDetalhes = await resposta.json();
    const detalheItem = listaDetalhes.find((d) => d.id === idProduto);

    if (!detalheItem || !itemBase) {
      throw new Error('Detalhes do produto não encontrados.');
    }

    renderizarConteudoModal(itemBase, detalheItem);
  } catch (erro) {
    console.error('Erro ao buscar detalhes do suplemento:', erro);
    elErroModal.classList.remove('d-none');
  } finally {
    elLoadingModal.classList.add('d-none');
  }
}

/**
 * Monta o HTML interno do Modal com as informações detalhadas vindas da 2ª requisição AJAX
 */
function renderizarConteudoModal(itemBase, detalhe) {
  const linhasNutricionais = detalhe.tabelaNutricional
    .map(
      (nutriente) => `
      <tr>
        <td>${nutriente.nutriente}</td>
        <td class="fw-semibold text-end">${nutriente.quantidade}</td>
        <td class="text-muted text-end">${nutriente.vd}</td>
      </tr>
    `
    )
    .join('');

  elConteudoModal.innerHTML = `
    <div class="row g-4">
      <div class="col-md-5 text-center">
        <img src="${itemBase.imagem}" alt="${itemBase.titulo}" class="img-fluid rounded shadow-sm mb-3">
        <div class="p-3 bg-light rounded text-start">
          <p class="mb-1 small"><strong><i class="bi bi-box-seam me-1"></i>Peso Líquido:</strong> ${detalhe.peso}</p>
          <p class="mb-1 small"><strong><i class="bi bi-cup-straw me-1"></i>Sabor:</strong> ${detalhe.sabor}</p>
          <p class="mb-0 small"><strong><i class="bi bi-check-circle me-1"></i>Disponibilidade:</strong> <span class="text-success fw-semibold">${detalhe.estoque}</span></p>
        </div>
      </div>

      <div class="col-md-7">
        <span class="badge bg-warning text-dark mb-2">${itemBase.categoria}</span>
        <h3 class="h4 fw-bold mb-2">${itemBase.titulo}</h3>
        <p class="fs-4 fw-extrabold text-dark mb-3">${formatarMoeda(itemBase.preco)}</p>

        <h4 class="h6 fw-bold text-uppercase text-secondary">Descrição Técnica</h4>
        <p class="small text-muted mb-3">${detalhe.descricaoCompleta}</p>

        <h4 class="h6 fw-bold text-uppercase text-secondary">Sugestão de Uso</h4>
        <p class="small text-muted mb-3">${detalhe.modoDeUso}</p>

        <h4 class="h6 fw-bold text-uppercase text-secondary">Ingredientes</h4>
        <p class="small text-muted mb-3">${detalhe.ingredientes}</p>

        <h4 class="h6 fw-bold text-uppercase text-secondary mb-2">Informação Nutricional <span class="fw-normal">(${detalhe.porcao})</span></h4>
        <div class="table-responsive">
          <table class="table table-sm table-bordered tabela-nutricional small mb-0">
            <thead>
              <tr>
                <th>Nutriente</th>
                <th class="text-end">Quantidade</th>
                <th class="text-end">%VD*</th>
              </tr>
            </thead>
            <tbody>
              ${linhasNutricionais}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  elConteudoModal.classList.remove('d-none');
}

/**
 * Limpa os campos de busca e filtro e restaura a listagem completa
 */
function limparFiltros() {
  inputBusca.value = '';
  selectCategoria.value = 'Todas';
  renderizarCatalogo(listaSuplementos);
}

// EVENT LISTENERS

document.addEventListener('DOMContentLoaded', () => {
  carregarCatalogo();

  // Eventos de busca e filtro em tempo real
  inputBusca.addEventListener('input', aplicarFiltros);
  selectCategoria.addEventListener('change', aplicarFiltros);

  // Botões de limpar filtros e tentar novamente
  btnLimpar.addEventListener('click', limparFiltros);
  btnResetarBusca.addEventListener('click', limparFiltros);
  btnTentarNovamente.addEventListener('click', carregarCatalogo);

  // Botão de tentar novamente dentro do Modal
  btnTentarModal.addEventListener('click', () => {
    if (ultimoIdSelecionado !== null) {
      carregarDetalhesProduto(ultimoIdSelecionado);
    }
  });

  // Delegação de eventos para capturar o clique no botão "Detalhes" de qualquer card
  elListaProdutos.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.btn-detalhes');
    if (botao) {
      const id = Number(botao.getAttribute('data-id'));
      carregarDetalhesProduto(id);
    }
  });
});