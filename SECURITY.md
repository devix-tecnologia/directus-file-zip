# Vulnerabilidades de Segurança Conhecidas

## Vulnerabilidades sem patch disponível

### pm2 - ReDoS (GHSA-x5gf-qvw8-r2rm)

- **Severidade**: Baixa (Low)
- **Pacote**: `pm2@6.0.14` (via `@directus/api`)
- **Tipo**: Regular Expression Denial of Service
- **Status**: Sem versão corrigida disponível (Patched versions: `<0.0.0`)
- **Impacto**: Esta vulnerabilidade afeta apenas o ambiente de desenvolvimento/teste, pois o `pm2` é uma dependência de desenvolvimento do `@directus/api`. Não afeta a produção deste pacote.
- **Decisão**: Aceitamos esta vulnerabilidade até que o mantenedor do `pm2` lance uma versão corrigida.
- **CI/CD**: Nossos workflows usam `pnpm audit --audit-level=high`, falhando apenas para vulnerabilidades **high** e **critical**, permitindo vulnerabilidades **low** e **moderate** conhecidas e documentadas.
- **Mais informações**: https://github.com/advisories/GHSA-x5gf-qvw8-r2rm

## Vulnerabilidades corrigidas via pnpm.overrides

Todas as outras vulnerabilidades foram corrigidas através da seção `pnpm.overrides` no `package.json`:

- ✅ `fast-xml-parser` atualizado para `>=5.5.7`
- ✅ `tar` atualizado para `>=7.5.11`
- ✅ `path-to-regexp` atualizado para `>=0.1.13`
- ✅ `lodash-es` atualizado para `>=4.18.0`
- ✅ `unhead` atualizado para `>=2.1.13`
- ✅ `axios` atualizado para `>=1.15.0`
- ✅ `qs` atualizado para `>=6.14.2`
- ✅ `srvx` atualizado para `>=0.11.13`
- ✅ `@tootallnate/once` atualizado para `>=3.0.1`

## Como verificar vulnerabilidades

Execute `pnpm audit` para verificar vulnerabilidades de segurança. A única vulnerabilidade esperada é a do `pm2` mencionada acima.
