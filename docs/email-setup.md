# Email — MozInkub / IEUL

## Destino oficial

Notificações: **cycode360@gmail.com** (`REGISTRATION_EMAIL` + Web3Forms Recipient).

## Envio — Web3Forms (browser)

Web3Forms **só funciona no cliente** no plano gratuito. Chamadas a partir do servidor Vercel devolvem **403**.

O fluxo correcto:

1. O formulário grava na base de dados (server action).
2. Em seguida o browser envia para `https://api.web3forms.com/submit` (`src/lib/web3forms-client.ts`).

Variável opcional: `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` (a key é pública por desenho).

## Resend (opcional, servidor)

Se existir `RESEND_API_KEY`, o servidor também tenta enviar (além do Web3Forms no browser).

## Formulários

| Origem | Assunto |
|--------|---------|
| Contacto | `[IEUL] Contacto: …` |
| Actualização / inscrição | `[IEUL] Inscrição: …` |
| Edital | `[IEUL] Candidatura edital: …` |

Se o email não chegar: verifique spam e, no Web3Forms, **Spam & Security** (domínio `mozinkub.vercel.app` permitido).

## Anexos

Anexos de inscrição → **Google Drive** (`docs/google-drive-setup.md`). Cloudinary fica só para media pública do site.
