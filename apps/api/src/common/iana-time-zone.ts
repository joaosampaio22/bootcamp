import { registerDecorator } from 'class-validator';

export function isIanaTimeZone(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 80 ||
      (value !== 'UTC' && !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/.test(value))) return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format(new Date(0));
    return true;
  } catch { return false; }
}

export function IsIanaTimeZone(): PropertyDecorator {
  return (target: object, property: string | symbol) => {
    registerDecorator({
      name: 'isIanaTimeZone', target: target.constructor, propertyName: String(property),
      validator: {
        validate: isIanaTimeZone,
        defaultMessage: () => 'Informe um fuso IANA válido, como America/Sao_Paulo.'
      }
    });
  };
}
