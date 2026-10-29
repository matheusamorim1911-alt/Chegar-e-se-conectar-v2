# Chegar e se conectar

Protótipo de app web para calouros da UFRJ na Cidade Universitária (Ilha do Fundão).
Disciplina: Habilidades Sociais.

## Estrutura

- `index.html`: estrutura da página (login, capa, abas, painéis)
- `css/style.css`: visual (temas claro e escuro, vidro)
- `js/config.js`: **configuração do login com Google** (começa desligado)
- `js/app.js`: lógica (mapa, linhas, trajeto, lugares, grade, calendário, siglas, fila do RU, gestão, conta)
- `img/`: mapa do campus em três resoluções e miniaturas
- `firestore.rules`: regras de segurança do banco, para colar no Firebase

## Como rodar

Abra a pasta no VS Code e use a extensão **Live Server** ("Go Live"), ou publique no GitHub Pages.
Sem configurar nada, o app funciona inteiro e salva os ajustes só no aparelho.

## Login com Google e ajustes na nuvem

Quando a pessoa entra com Google, o app guarda na conta dela os **ajustes** (capa, plano de fundo,
avisos, animação das rotas, tela de entrada), o **trajeto favorito** e a **grade**. Ao entrar em outro
aparelho, tudo volta. Isso usa o Firebase (gratuito para este uso):

```
Navegador ──"Entrar com Google"──▶ Firebase Authentication ──▶ uid da pessoa
    │                                                    │
    └── salva/lê ajustes ──▶ Firestore: usuarios/<uid> ◀──┘ (regra: só o dono lê e grava)
```

### Passo a passo (uns 10 minutos)

1. **Crie o projeto.** Entre em https://console.firebase.google.com com sua conta Google e clique em
   *Adicionar projeto*. Pode desligar o Google Analytics.
2. **Ligue o login com Google.** No menu, *Authentication* › *Começar* › aba *Método de login* ›
   *Google* › *Ativar* › escolha o e-mail de suporte › *Salvar*.
3. **Autorize o endereço do site.** Ainda em *Authentication*, aba *Configurações* ›
   *Domínios autorizados* › *Adicionar domínio*: `matheusamorim1911-alt.github.io`
   (o `localhost` já vem autorizado, para testar com o Live Server).
4. **Crie o banco.** No menu, *Firestore Database* › *Criar banco de dados* › modo de produção ›
   escolha a região `southamerica-east1 (São Paulo)`. Depois, na aba *Regras*, apague o que estiver lá,
   cole o conteúdo do arquivo `firestore.rules` e clique em *Publicar*.
5. **Pegue a configuração.** Ícone de engrenagem › *Configurações do projeto* › *Seus apps* › ícone
   `</>` (Web) › dê um apelido › *Registrar app*. Copie o objeto `firebaseConfig` que aparece.
6. **Cole no app.** Abra `js/config.js`, troque `window.CSE_FIREBASE = null;` por
   `window.CSE_FIREBASE = { ...o objeto copiado... };` e salve.
7. **Publique.** Suba os arquivos no GitHub (substituindo os antigos). Em um ou dois minutos o botão
   *Entrar com Google* aparece na tela de entrada e em *Ajustes › Conta*.

### Observações

- No **claude.ai** o botão do Google não aparece: lá a própria conta do Claude identifica a pessoa e os
  ajustes já ficam salvos na conta, de forma privada.
- O login com Face ID e código de 4 dígitos continua sendo uma simulação do protótipo.
- A tela de gestão, fora do claude.ai, funciona em modo demonstração (salva só no aparelho).
