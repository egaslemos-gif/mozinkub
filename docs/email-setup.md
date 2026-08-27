# Email — MozInkub / IEUL

## Destino (teste)

Por omissão as notificações vão para **egaslemos@gmail.com** (`TEST_INBOX` em `src/lib/mail.ts`).

Quando tiverem o email institucional real:

```bash
# Local (.env.local)
REGISTRATION_EMAIL="incubadora@ul.ac.mz"

# Vercel
npx vercel env add REGISTRATION_EMAIL production
```

Ordem de resolução: campo da actualização → `REGISTRATION_EMAIL` → `INQUIRY_EMAIL` → email da Identidade do site → inbox de teste.

## Envio

### Opção A — Resend (produção)

1. Conta em [resend.com](https://resend.com) (idealmente com o mesmo Gmail de teste).
2. Criar API key → `RESEND_API_KEY` no Vercel (Production + Preview).
3. Com domínio verificado: `MAIL_FROM="IEUL MozInkub <noreply@seudominio.com>"`.
4. Sem domínio: o remetente `onboarding@resend.dev` só entrega ao email da conta Resend.

### Opção B — FormSubmit (teste imediato)

Sem `RESEND_API_KEY`, o app usa [FormSubmit](https://formsubmit.co):

1. Faça uma inscrição / contacto de teste no site.
2. Abra **egaslemos@gmail.com** e clique no link de **activação** do FormSubmit (só na 1.ª vez).
3. As seguintes notificações chegam automaticamente.

Desactivar: `MAIL_FORMSUBMIT_FALLBACK=0`.

## O que dispara email

| Origem | Assunto |
|--------|---------|
| Inscrição em Actualização | `[IEUL] Inscrição: …` |
| Formulário de contacto | `[IEUL] Contacto: …` |
| Candidatura a edital | `[IEUL] Candidatura edital: …` |

Reply-To = email do candidato (pode responder directamente). Os registos ficam sempre na base de dados do admin.
