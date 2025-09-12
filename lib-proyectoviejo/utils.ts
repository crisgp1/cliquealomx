import numeroALetras from '@vigilio/numeros-a-letras';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitaliza correctamente las marcas de autos en un título
 * Maneja casos especiales como BMW, Mercedes-Benz, etc.
 * Reorganiza el título al formato español: Marca Modelo Año
 */
export function capitalizeBrandInTitle(title: string): string {
  if (!title) return title;

  // Mapa de marcas con su capitalización correcta
  const brandCapitalization: Record<string, string> = {
    'bmw': 'BMW',
    'mercedes-benz': 'Mercedes-Benz',
    'mercedes': 'Mercedes-Benz',
    'volkswagen': 'Volkswagen',
    'nissan': 'Nissan',
    'toyota': 'Toyota',
    'honda': 'Honda',
    'ford': 'Ford',
    'chevrolet': 'Chevrolet',
    'hyundai': 'Hyundai',
    'kia': 'Kia',
    'mazda': 'Mazda',
    'suzuki': 'Suzuki',
    'audi': 'Audi',
    'seat': 'SEAT',
    'renault': 'Renault',
    'peugeot': 'Peugeot',
    'mitsubishi': 'Mitsubishi',
    'jeep': 'Jeep',
    'subaru': 'Subaru',
    'volvo': 'Volvo',
    'lexus': 'Lexus',
    'infiniti': 'Infiniti',
    'acura': 'Acura',
    'cadillac': 'Cadillac',
    'lincoln': 'Lincoln',
    'buick': 'Buick',
    'gmc': 'GMC',
    'dodge': 'Dodge',
    'chrysler': 'Chrysler',
    'ram': 'RAM',
    'fiat': 'FIAT',
    'alfa romeo': 'Alfa Romeo',
    'maserati': 'Maserati',
    'ferrari': 'Ferrari',
    'lamborghini': 'Lamborghini',
    'porsche': 'Porsche',
    'bentley': 'Bentley',
    'rolls-royce': 'Rolls-Royce',
    'jaguar': 'Jaguar',
    'land rover': 'Land Rover',
    'mini': 'MINI',
    'smart': 'smart',
    'tesla': 'Tesla',
    'genesis': 'Genesis',
    'mg': 'MG',
    'byd': 'BYD',
    'chery': 'Chery',
    'geely': 'Geely',
    'great wall': 'Great Wall',
    'haval': 'Haval',
    'jac': 'JAC',
    'dongfeng': 'Dongfeng',
    'foton': 'Foton',
    'isuzu': 'Isuzu',
    'hino': 'Hino',
    'freightliner': 'Freightliner',
    'kenworth': 'Kenworth',
    'peterbilt': 'Peterbilt',
    'mack': 'Mack',
    'international': 'International'
  };

  // Modelo especiales que también necesitan capitalización
  const modelCapitalization: Record<string, string> = {
    'x1': 'X1',
    'x2': 'X2',
    'x3': 'X3',
    'x4': 'X4',
    'x5': 'X5',
    'x6': 'X6',
    'x7': 'X7',
    'm3': 'M3',
    'm4': 'M4',
    'm5': 'M5',
    'm50i': 'M50i',
    'm40i': 'M40i',
    'm35i': 'M35i',
    'amg': 'AMG',
    'gti': 'GTI',
    'gts': 'GTS',
    'rs': 'RS',
    'xdrive': 'Xdrive',
    'tacoma': 'TACOMA',
    'trd': 'TRD',
    'sport': 'Sport',
    'rubicon': 'Rubicon',
    'raptor': 'Raptor',
    'cupra': 'Cupra',
    'blazer': 'BLAZER',
    'sportback': 'Sportback',
    'navigator': 'Navigator',
    'xt4': 'XT4',
    'urus': 'Urus',
    'macan': 'Macan',
    'rsq3': 'RSQ3',
    'c63s': 'C63s',
    'swift': 'Swift',
    'q5': 'Q5',
    'cla': 'CLA',
    '45s': '45s',
    '718': '718',
    'boxters': 'Boxters',
    'g63': 'G63',
    'carrera': 'Carrera',
    'turbo': 'Turbo',
    'bronco': 'Bronco',
    'mustang': 'Mustang',
    'gt': 'GT',
    'glc': 'GLC',
    '43': '43',
    'cooper': 'Cooper',
    'wrangler': 'Wrangler',
    'leon': 'Leon',
    'dark': 'Dark',
    'horse': 'Horse'
  };

  // Primero, manejar marcas compuestas (ej: Mercedes-Benz, Land Rover)
  let processedTitle = title;
  for (const [key, value] of Object.entries(brandCapitalization)) {
    if (key.includes(' ') || key.includes('-')) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      processedTitle = processedTitle.replace(regex, value);
    }
  }
  
  // Dividir el título en palabras
  const words = processedTitle.split(' ');
  
  // Detectar si el primer elemento es un año
  let year = '';
  let titleParts: string[] = [];
  
  if (words.length > 0 && /^\d{4}$/.test(words[0])) {
    // Si el título empieza con año (formato: 2022 bmw x5)
    year = words[0];
    titleParts = words.slice(1);
  } else {
    // Si el año está al final o no hay año
    const lastWord = words[words.length - 1];
    if (/^\d{4}$/.test(lastWord)) {
      year = lastWord;
      titleParts = words.slice(0, -1);
    } else {
      titleParts = words;
    }
  }
  
  // Procesar cada parte del título (sin el año)
  const processedParts = titleParts.map((word) => {
    const lowerWord = word.toLowerCase();
    
    // Buscar coincidencia exacta en marcas
    if (brandCapitalization[lowerWord]) {
      return brandCapitalization[lowerWord];
    }
    
    // Buscar coincidencia exacta en modelos
    if (modelCapitalization[lowerWord]) {
      return modelCapitalization[lowerWord];
    }
    
    // Si no se encuentra en los mapas, capitalizar primera letra
    if (word.length > 0 && /^[a-z]/.test(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    return word;
  });
  
  // Reconstruir el título con el formato español: Marca Modelo Año
  const finalTitle = year 
    ? [...processedParts, year].join(' ')
    : processedParts.join(' ');
  
  return finalTitle;
}

/**
 * Capitaliza correctamente una marca de auto
 */
export function capitalizeBrand(brand: string): string {
  if (!brand) return brand;

  const brandCapitalization: Record<string, string> = {
    'bmw': 'BMW',
    'mercedes-benz': 'Mercedes-Benz',
    'mercedes': 'Mercedes-Benz',
    'volkswagen': 'Volkswagen',
    'nissan': 'Nissan',
    'toyota': 'Toyota',
    'honda': 'Honda',
    'ford': 'Ford',
    'chevrolet': 'Chevrolet',
    'hyundai': 'Hyundai',
    'kia': 'Kia',
    'mazda': 'Mazda',
    'suzuki': 'Suzuki',
    'audi': 'Audi',
    'seat': 'SEAT',
    'renault': 'Renault',
    'peugeot': 'Peugeot',
    'mitsubishi': 'Mitsubishi',
    'jeep': 'Jeep'
  };

  const lowerBrand = brand.toLowerCase();
  return brandCapitalization[lowerBrand] || brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

/**
 * Formatea una cantidad numérica con formato mexicano: $123,456.78
 */
export function formatCurrencyMX(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[,$]/g, '')) : amount;
  
  if (isNaN(numAmount)) return '$0.00';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Detecta si una cantidad tiene formato de centavos (XX/100)
 */
export function detectCentsFormat(amount: string): { hasFormat: boolean; pesos: number; centavos: number } {
  // Remover símbolos de moneda
  let cleanAmount = amount.replace(/[$,]/g, '');
  
  // Buscar patrón XX/100 o XX/XX (con posible espacio antes)
  const centsMatch = cleanAmount.match(/(\d+)\s+(\d+)\/(\d+)$/);
  
  if (centsMatch) {
    const pesos = parseInt(centsMatch[1]);
    const centavos = parseInt(centsMatch[2]);
    const divisor = parseInt(centsMatch[3]);
    
    return {
      hasFormat: true,
      pesos,
      centavos: divisor === 100 ? centavos : Math.round((centavos / divisor) * 100)
    };
  }
  
  // Buscar patrón simple solo centavos/100 (ej: 50/100 = 50 centavos)
  const onlyCentsMatch = cleanAmount.match(/^(\d{1,2})\/100$/);
  if (onlyCentsMatch) {
    const centavos = parseInt(onlyCentsMatch[1]);
    
    return {
      hasFormat: true,
      pesos: 0,
      centavos
    };
  }
  
  // Si no tiene formato especial, parsearlo como decimal normal
  const numAmount = parseFloat(cleanAmount.replace(/\s/g, ''));
  if (isNaN(numAmount)) {
    return { hasFormat: false, pesos: 0, centavos: 0 };
  }
  
  const pesos = Math.floor(numAmount);
  const centavos = Math.round((numAmount - pesos) * 100);
  
  return { hasFormat: false, pesos, centavos };
}

/**
 * Convierte número a palabras en español (corrección gramatical)
 * Evita el error "un millón de noventa mil" -> "un millón noventa mil"
 */
function numberToWordsSpanish(num: number): string {
  if (num === 0) return 'cero';
  
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  function convertChunk(n: number): string {
    if (n === 0) return '';
    
    let result = '';
    
    // Hundreds
    if (n >= 100) {
      if (n === 100) {
        result += 'cien';
      } else {
        result += hundreds[Math.floor(n / 100)];
      }
      n %= 100;
      if (n > 0) result += ' ';
    }
    
    // Tens and units
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) {
        result += ' y ' + units[n];
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += units[n];
    }
    
    return result;
  }
  
  if (num < 1000) {
    return convertChunk(num);
  }
  
  let result = '';
  let scale = ['', 'mil', 'millón', 'mil millones', 'billón'];
  let scaleIndex = 0;
  
  // Handle millions and billions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    if (millions === 1) {
      result += 'un millón';
    } else {
      result += convertChunk(millions) + ' millones';
    }
    num %= 1000000;
    
    // CRITICAL FIX: No "de" when followed by more numbers
    if (num > 0) {
      result += ' ' + numberToWordsSpanish(num);
    }
    return result;
  }
  
  // Handle thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      result += 'mil';
    } else {
      result += convertChunk(thousands) + ' mil';
    }
    num %= 1000;
    
    if (num > 0) {
      result += ' ' + convertChunk(num);
    }
    return result;
  }
  
  return convertChunk(num);
}

/**
 * Convierte una cantidad a palabras con formato mexicano
 * Capitaliza las palabras y agrega "MONEDA NACIONAL MXN"
 * CORRIGE: "un millón de noventa mil" -> "un millón noventa mil"
 */
export function amountToWords(amount: number | string): string {
  const { pesos, centavos } = detectCentsFormat(String(amount));
  
  try {
    // Usar nuestra función personalizada para corregir gramática
    const pesosInWords = numberToWordsSpanish(pesos);
    
    // Capitalizar cada palabra y limpiar espacios extra
    const capitalizedPesos = pesosInWords
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Formatear resultado final
    let result = `${capitalizedPesos} Pesos`;
    
    // Agregar centavos si hay
    if (centavos > 0) {
      result += ` ${centavos.toString().padStart(2, '0')}/100`;
    } else {
      result += ` 00/100`;
    }
    
    // Agregar moneda nacional
    result += ' Moneda Nacional MXN';
    
    return result;
  } catch (error) {
    console.error('Error converting amount to words:', error);
    return `${pesos} Pesos ${centavos.toString().padStart(2, '0')}/100 Moneda Nacional MXN`;
  }
}

/**
 * Formatea una cantidad mientras el usuario escribe (formato en tiempo real)
 * Mantiene la escritura natural de izquierda a derecha
 */
export function formatAmountWhileTyping(input: string): string {
  // Remover todo excepto dígitos
  const digitsOnly = input.replace(/[^\d]/g, '');
  
  // Si está vacío, devolver vacío
  if (!digitsOnly) return '';
  
  // Convertir directamente a número (sin división por 100)
  // El usuario escribe el número completo como lo piensa
  const number = parseInt(digitsOnly);
  
  return formatCurrencyMX(number);
}

/**
 * Formatea una cantidad de entrada del usuario y la convierte a palabras
 */
export function formatAndConvertAmount(userInput: string): {
  formatted: string;
  inWords: string;
  numericValue: number;
  rawInput: string;
} {
  const { pesos, centavos } = detectCentsFormat(userInput);
  const numericValue = pesos + (centavos / 100);
  
  return {
    formatted: formatCurrencyMX(numericValue),
    inWords: amountToWords(numericValue),
    numericValue,
    rawInput: userInput
  };
}

/**
 * Calcula la nueva posición del cursor después del formateo
 */
function calculateCursorPosition(
  oldValue: string,
  newValue: string,
  oldCursorPos: number,
  digitsAdded: number
): number {
  // Contar cuántos caracteres no dígitos hay antes de la posición del cursor en el valor anterior
  const oldDigitsOnly = oldValue.replace(/[^\d]/g, '');
  const newDigitsOnly = newValue.replace(/[^\d]/g, '');
  
  // Si se agregaron dígitos, mover el cursor proporcionalmente
  const digitPosition = oldDigitsOnly.length + digitsAdded;
  
  // Contar caracteres hasta llegar a la posición del dígito en el nuevo valor formateado
  let charCount = 0;
  let digitCount = 0;
  
  for (let i = 0; i < newValue.length; i++) {
    if (/\d/.test(newValue[i])) {
      digitCount++;
      if (digitCount >= digitPosition) {
        return i + 1; // Posición después del último dígito insertado
      }
    }
    charCount++;
  }
  
  return newValue.length; // Si no se encuentra, al final
}

/**
 * Maneja la entrada del usuario para cantidad con formateo inteligente
 */
export function handleAmountInput(
  currentValue: string, 
  newInput: string, 
  cursorPosition: number
): {
  formattedValue: string;
  newCursorPosition: number;
  inWords: string;
  numericValue: number;
} {
  // Extraer solo dígitos de ambos valores
  const oldDigits = currentValue.replace(/[^\d]/g, '');
  const newDigits = newInput.replace(/[^\d]/g, '');
  
  // Formatear usando la función de tiempo real
  const formatted = formatAmountWhileTyping(newInput);
  
  // Si está vacío, devolver valores por defecto
  if (!formatted) {
    return {
      formattedValue: '',
      newCursorPosition: 0,
      inWords: '',
      numericValue: 0
    };
  }
  
  // Calcular nueva posición del cursor
  const digitsAdded = newDigits.length - oldDigits.length;
  const newCursorPosition = calculateCursorPosition(
    currentValue, 
    formatted, 
    cursorPosition, 
    digitsAdded
  );
  
  // Obtener valor numérico para conversión a letras
  const numericValue = parseFloat(formatted.replace(/[$,]/g, '')) || 0;
  const inWords = numericValue > 0 ? amountToWords(numericValue) : '';
  
  return {
    formattedValue: formatted,
    newCursorPosition,
    inWords,
    numericValue
  };
}