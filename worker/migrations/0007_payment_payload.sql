-- Resumo sem dados pessoais do aviso de pagamento (produto, oferta, preço e status).
-- Serve para diagnosticar compras cujo plano não foi reconhecido, sem guardar telefone, nome ou e-mail.
ALTER TABLE payment_events ADD COLUMN payload TEXT;
