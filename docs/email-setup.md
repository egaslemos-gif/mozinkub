# Email — MozInkub / IEUL

## Destino oficial

Notificações vão para **elemos@unilicungo.ac.mz** (`DEFAULT_INBOX` em `src/lib/mail.ts` e `REGISTRATION_EMAIL`).

Para alterar:

```bash
# Local (.env.local)
REGISTRATION_EMAIL="elemos@unilicungo.ac.mz"

# Vercel
npx vercel env add REGISTRATION_EMAIL production
```

Ordem de resolução: campo da actualização → `REGISTRATION_EMAIL` → `INQUIRY_EMAIL` → email da Identidade do site → `DEFAULT_INBOX`.

## Envio

### Opção A — Resend (produção)

1. Conta em [resend.com](https://resend.com).
2. Criar API key → `RESEND_API_KEY` no Vercel (Production + Preview).
3. Com domínio verificado: `MAIL_FROM="IEUL MozInkub <noreply@seudominio.com>"`.
4. Sem domínio: o remetente `onboarding@resend.dev` só entrega ao email da conta Resend.

### Opção B — FormSubmit (sem API key)

Sem `RESEND_API_KEY`, o app usa [FormSubmit](https://formsubmit.co):

1. Faça uma inscrição / contacto de teste no site.
2. Abra **elemos@unilicungo.ac.mz** e clique no link de **activação** do FormSubmit (só na 1.ª vez).
3. As seguintes notificações chegam automaticamente.

Desactivar: `MAIL_FORMSUBMIT_FALLBACK=0`.

## O que dispara email

| Origem | Assunto |
|--------|---------|
| Inscrição em Actualização | `[IEUL] Inscrição: …` |
| Formulário de contacto | `[IEUL] Contacto: …` |
| Candidatura a edital | `[IEUL] Candidatura edital: …` |

Reply-To = email do candidato (pode responder directamente). Os registos ficam sempre na base de dados do admin.
