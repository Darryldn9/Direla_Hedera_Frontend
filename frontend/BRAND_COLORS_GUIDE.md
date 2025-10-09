# Brand Colors Usage Guide

This guide explains how to use the centralized brand color system throughout the application.

## Brand Colors

Our brand uses these four core colors:

- **Light Grey**: `#F6F6F6` (instead of white)
- **Dark Grey**: `#1E1E1E` (instead of black)  
- **Green**: `#006A4E` (primary brand color)
- **Yellow**: `#FFD403` (accent color)

## Usage in Frontend (React Native)

### Import Colors
```typescript
import { Colors } from '../lib/colors';
```

### Basic Usage Examples

#### Background Colors
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.semantic.background, // #F6F6F6
  },
  card: {
    backgroundColor: Colors.semantic.surface, // #FFFFFF
  },
});
```

#### Text Colors
```typescript
const styles = StyleSheet.create({
  title: {
    color: Colors.semantic.textPrimary, // #1E1E1E
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.semantic.textSecondary, // #8E8E93
    fontSize: 16,
  },
});
```

#### Interactive Elements
```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.semantic.primary, // #006A4E
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: Colors.utility.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.semantic.secondary, // #FFD403
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
```

#### Status Colors
```typescript
const styles = StyleSheet.create({
  successToast: {
    backgroundColor: Colors.semantic.success, // #006A4E
  },
  warningToast: {
    backgroundColor: Colors.semantic.warning, // #FFD403
  },
  errorToast: {
    backgroundColor: Colors.semantic.error, // #FF3B30
  },
});
```

### Icon Colors
```typescript
// In JSX
<CheckCircle size={20} color={Colors.semantic.success} />
<AlertCircle size={20} color={Colors.semantic.error} />
<Info size={20} color={Colors.semantic.info} />
```

### Shadow Colors
```typescript
const styles = StyleSheet.create({
  card: {
    shadowColor: Colors.semantic.shadow, // #000000
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
```

## Color Categories

### Brand Colors (`Colors.brand`)
- `lightGrey`: `#F6F6F6`
- `darkGrey`: `#1E1E1E`
- `green`: `#006A4E`
- `yellow`: `#FFD403`

### Semantic Colors (`Colors.semantic`)
These are derived from brand colors and provide semantic meaning:

#### Backgrounds
- `background`: `#F6F6F6` (main app background)
- `surface`: `#FFFFFF` (cards, modals)
- `surfaceSecondary`: `#F6F6F6` (secondary surfaces)

#### Text
- `textPrimary`: `#1E1E1E` (main text)
- `textSecondary`: `#8E8E93` (muted text)
- `textTertiary`: `#C7C7CC` (very light text)

#### Interactive
- `primary`: `#006A4E` (primary buttons, links)
- `primaryHover`: `#005A42` (hover states)
- `secondary`: `#FFD403` (secondary buttons)
- `secondaryHover`: `#E6BF03` (hover states)

#### Status
- `success`: `#006A4E` (success messages)
- `warning`: `#FFD403` (warning messages)
- `error`: `#FF3B30` (error messages)
- `info`: `#007AFF` (info messages)

#### Borders & Shadows
- `border`: `#E5E5E5` (light borders)
- `borderSecondary`: `#F0F0F0` (very light borders)
- `borderFocus`: `#006A4E` (focus borders)
- `shadow`: `#000000` (shadow color)

### Utility Colors (`Colors.utility`)
- `white`: `#FFFFFF`
- `black`: `#000000`
- `transparent`: `transparent`
- `overlay`: `rgba(0, 0, 0, 0.5)`

## Helper Functions

### With Opacity
```typescript
import { withOpacity } from '../lib/colors';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: withOpacity(Colors.semantic.textPrimary, 0.5),
  },
});
```

### Get Semantic Color
```typescript
import { getSemanticColor } from '../lib/colors';

const primaryColor = getSemanticColor('primary'); // #006A4E
```

### Get Brand Color
```typescript
import { getBrandColor } from '../lib/colors';

const brandGreen = getBrandColor('green'); // #006A4E
```

## Migration from Old Colors

### Before (Old Colors)
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F7', // Old iOS background
  },
  text: {
    color: '#1C1C1E', // Old dark text
  },
  button: {
    backgroundColor: '#0C7C59', // Old green
  },
});
```

### After (New Brand Colors)
```typescript
import { Colors } from '../lib/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.semantic.background, // #F6F6F6
  },
  text: {
    color: Colors.semantic.textPrimary, // #1E1E1E
  },
  button: {
    backgroundColor: Colors.semantic.primary, // #006A4E
  },
});
```

## Best Practices

1. **Always use semantic colors** instead of hardcoded hex values
2. **Use brand colors** for primary UI elements
3. **Use utility colors** for basic needs (white, black, transparent)
4. **Import Colors once** at the top of your component file
5. **Use helper functions** for opacity and dynamic color selection
6. **Follow the semantic naming** - use `textPrimary` for main text, not `darkGrey`

## Backend Usage

The backend logger uses ANSI color codes that approximate our brand colors:

```typescript
// In backend/src/utils/logger.ts
const colors = {
  brandGreen: '\x1b[32m',  // #006A4E -> green
  brandYellow: '\x1b[33m', // #FFD403 -> yellow
  brandDarkGray: '\x1b[90m', // #1E1E1E -> gray
  brandLightGray: '\x1b[37m' // #F6F6F6 -> white
};
```

## TypeScript Support

The color system includes full TypeScript support:

```typescript
import { Colors, ColorKey, BrandColorKey, SemanticColorKey } from '../lib/colors';

// Type-safe color access
const primaryColor: string = Colors.semantic.primary;
const brandGreen: string = Colors.brand.green;
```

This ensures you get autocomplete and type checking when using colors throughout your application.
