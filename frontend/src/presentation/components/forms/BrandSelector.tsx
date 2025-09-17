'use client';

import { useState, useMemo } from 'react';
import { Combobox, TextInput, useCombobox, Group, Text, Stack } from '@mantine/core';
import { IconSearch, IconCar, IconCheck } from '@tabler/icons-react';
import { searchBrands, BRAND_OPTIONS_WITH_OTHER, getBrandDisplayName } from '@/lib/data/vehicleBrands';

interface BrandSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  onCustomBrandChange?: (customBrand: string) => void;
  customBrand?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function BrandSelector({
  value = '',
  onChange,
  onCustomBrandChange,
  customBrand = '',
  label = 'Marca',
  placeholder = 'Busca tu marca...',
  required = false,
  error,
  description
}: BrandSelectorProps) {
  const [search, setSearch] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(value === 'otra');

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    return searchBrands(search || '');
  }, [search]);

  const handleOptionSubmit = (selectedValue: string) => {
    if (selectedValue === 'otra') {
      setShowCustomInput(true);
      onChange(selectedValue);
    } else {
      setShowCustomInput(false);
      onChange(selectedValue);
      if (onCustomBrandChange) {
        onCustomBrandChange(''); // Clear custom brand when selecting from list
      }
    }
    setSearch(null); // Clear search after selection
    combobox.closeDropdown();
  };

  const displayValue = useMemo(() => {
    // Always prioritize search when it exists (including empty string when user cleared)
    if (search !== null) return search;
    if (value === 'otra') {
      return customBrand || 'Otra marca';
    }
    return value ? getBrandDisplayName(value) : '';
  }, [value, customBrand, search]);

  const options = filteredBrands.map((brand) => (
    <Combobox.Option
      value={brand.value}
      key={brand.value}
      style={{
        padding: '8px 12px',
        borderRadius: '4px',
        margin: '2px 0',
        cursor: 'pointer',
        transition: 'background-color 0.1s ease'
      }}
    >
      <Group gap="sm" justify="space-between">
        <Group gap="sm">
          {brand.value === 'otra' ? (
            <IconCar size={16} style={{ color: 'var(--mantine-color-orange-6)' }} />
          ) : (
            <div style={{ width: 16 }} /> // Spacer for alignment
          )}
          <Text
            size="sm"
            style={{
              fontWeight: brand.value === value ? 500 : 400,
              color: brand.value === 'otra' ? 'var(--mantine-color-orange-7)' : undefined
            }}
          >
            {brand.label}
          </Text>
        </Group>
        {brand.value === value && (
          <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
        )}
      </Group>
    </Combobox.Option>
  ));

  return (
    <Stack gap="xs">
      <Combobox
        store={combobox}
        onOptionSubmit={handleOptionSubmit}
        position="bottom-start"
        middlewares={{ flip: true, shift: true }}
        offset={4}
        width="target"
        dropdownPadding={0}
      >
        <Combobox.Target>
          <TextInput
            label={label}
            description={description}
            placeholder={placeholder}
            required={required}
            error={error}
            value={displayValue}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => {
              combobox.openDropdown();
            }}
            onBlur={() => {
              combobox.closeDropdown();
              // Only reset search if no value was selected and search is empty
              if (!value && search === '') {
                setSearch(null);
              }
            }}
            rightSection={<IconSearch size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />}
          />
        </Combobox.Target>

        <Combobox.Dropdown
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Combobox.Options
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {options.length > 0 ? (
              <>
                {/* Category hint for better UX */}
                {(search === null || search === '') && (
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--mantine-color-dimmed)',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                    marginBottom: '4px',
                    fontWeight: 500
                  }}>
                    {filteredBrands.length} marcas disponibles • Scroll para ver más
                  </div>
                )}
                {options}
              </>
            ) : (
              <Combobox.Empty>
                <Group gap="sm" p="sm">
                  <IconSearch size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                  <div>
                    <Text size="sm">No se encontraron marcas</Text>
                    <Text size="xs" c="dimmed">
                      Prueba con otro término o selecciona &quot;Otra marca&quot;
                    </Text>
                  </div>
                </Group>
              </Combobox.Empty>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      {/* Custom brand input when "Otra" is selected */}
      {showCustomInput && value === 'otra' && (
        <TextInput
          label="Especifica la marca"
          placeholder="Ej: Marca personalizada, marca local, etc."
          value={customBrand}
          onChange={(e) => onCustomBrandChange?.(e.target.value)}
          required={required}
          description="Escribe el nombre exacto de la marca"
          style={{
            marginTop: 4,
            padding: 8,
            backgroundColor: 'var(--mantine-color-blue-0)',
            borderRadius: 4,
            border: '1px solid var(--mantine-color-blue-3)'
          }}
        />
      )}

      {/* Search hints */}
      {search && search.length > 0 && filteredBrands.length > 0 && (
        <Text size="xs" c="dimmed">
          {filteredBrands.length} marca{filteredBrands.length !== 1 ? 's' : ''} encontrada{filteredBrands.length !== 1 ? 's' : ''}
          {search.length >= 2 && (
            <> • Búsqueda: &quot;{search}&quot;</>
          )}
        </Text>
      )}
    </Stack>
  );
}