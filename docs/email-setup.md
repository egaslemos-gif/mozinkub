# Email — MozInkub / IEUL

## Destino oficial

Notificações vão para **elemos@unilicungo.ac.mz** (`DEFAULT_INBOX` / `REGISTRATION_EMAIL`).

O Web3Forms entrega no email com que criou a access key no dashboard — confirme que é o mesmo endereço.

## Envio

### Web3Forms (activo)

Access key: `WEB3FORMS_ACCESS_KEY` (ou a key por omissão no código).

As server actions enviam `POST` para `https://api.web3forms.com/submit` com assunto, mensagem e Reply-To do candidato.

### Resend (opcional)

Se existir `RESEND_API_KEY`, tem prioridade sobre Web3Forms.

## O que dispara email

| Origem | Assunto |
|--------|---------|
| Inscrição em Actualização | `[IEUL] Inscrição: …` |
| Formulário de contacto | `[IEUL] Contacto: …` |
| Candidatura a edital | `[IEUL] Candidatura edital: …` |

Os registos ficam sempre na base de dados do admin.
