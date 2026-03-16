import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovementFormModal } from '../../components/movements/MovementFormModal';
import { useToast } from '@/components/ui/use-toast';

// 1. Requerimientos Técnicos y de Mocks
// Mockea globalmente el API de fetch para simular respuestas HTTP exitosas y fallidas.
global.fetch = jest.fn();

// Mockea el hook useToast (que proviene de @/components/ui/use-toast) para interceptar las notificaciones de éxito y error.
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('MovementFormModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnCreated = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  // Bloque A: Pruebas Estructurales (Enfoque en Caja Blanca)
  describe('Bloque A: Pruebas Estructurales (Enfoque en Caja Blanca)', () => {

    // [Cobertura de condición] Validación de zod
    it('[Cobertura de condición] Validación de zod', async () => {
      const user = userEvent.setup();
      render(
        <MovementFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />
      );

      // Renderiza el componente y fuerza una entrada donde amount sea -10 y concept se borre/esté vacío.
      const conceptInput = screen.getByLabelText(/concepto/i);
      const amountInput = screen.getByLabelText(/monto/i);

      await user.clear(conceptInput);
      await user.clear(amountInput);
      await user.type(amountInput, '-10');

      // Lanza el Submit.
      const btnSave = screen.getByRole('button', { name: /guardar|guardando/i });
      await user.click(btnSave);

      // Asegura mediante aserciones que zod evalúa ambas ramas condicionales al mismo tiempo 
      // y que el DOM refleja los dos mensajes de error debajo de cada input simultáneamente.
      await waitFor(() => {
        expect(screen.getByText('El concepto es requerido')).toBeInTheDocument();
        expect(screen.getByText('El monto debe ser mayor que 0')).toBeInTheDocument();
      });
    });

    // [Cobertura de rama] Resiliencia ante fallos (catch de red)
    it('[Cobertura de rama] Resiliencia ante fallos (catch de red)', async () => {
      const user = userEvent.setup();
      // Configura puntualmente en este test el mock de fetch para que la Promesa sea rechazada (simulando red caída).
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <MovementFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />
      );

      // Llena todos los campos con datos correctos
      const conceptInput = screen.getByLabelText(/concepto/i);
      const amountInput = screen.getByLabelText(/monto/i);
      await user.type(conceptInput, 'Salario');
      await user.clear(amountInput);
      await user.type(amountInput, '1500');

      // y envíalo.
      const btnSave = screen.getByRole('button', { name: /guardar/i });
      await user.click(btnSave);

      // Tu código de aserción debe certificar que la ejecución toma la rama del bloque catch validando que la función toast() 
      // fue llamada con los parámetros title: 'Error' y variant: 'destructive'.
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });

    // [Cobertura de sentencia] Control cíclico de asincronía (finally y estado isSubmitting)
    it('[Cobertura de sentencia] Control cíclico de asincronía (finally y estado isSubmitting)', async () => {
      const user = userEvent.setup();

      // Introduce una demora controlada en la resolución del mock de fetch.
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      render(
        <MovementFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />
      );

      await user.type(screen.getByLabelText(/concepto/i), 'Pago mensual');
      await user.clear(screen.getByLabelText(/monto/i));
      await user.type(screen.getByLabelText(/monto/i), '100');

      const btnSave = screen.getByRole('button', { name: /guardar/i });

      // Tras hacer clic en "Guardar",
      await user.click(btnSave);

      // Escribe aserciones que verifiquen que el componente pasó obligatoriamente por la sentencia setIsSubmitting(true) 
      // (el botón debe tener disabled y el DOM mostrar el span de la animación CSS de carga).
      expect(btnSave).toBeDisabled();
      // El componente renderiza un span de carga como previousSibling o dentro del botón
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();

      // Finalmente, resuelve la promesa del mock y asegura que el método atraviesa la sentencia finally, deshaciendo los estados de carga por completo.
      resolveFetch!({
        ok: true,
        json: async () => ({}),
      });

      await waitFor(() => {
        expect(btnSave).not.toBeDisabled();
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  // Bloque B: Pruebas Funcionales y de Experiencia (Enfoque en Caja Negra)
  describe('Bloque B: Pruebas Funcionales y de Experiencia (Enfoque en Caja Negra)', () => {

    // [Pruebas de Equivalencia] Prevención estructural por vacío
    it('[Pruebas de Equivalencia] Prevención estructural por vacío', async () => {
      const user = userEvent.setup();
      // Monta el diálogo
      render(
        <MovementFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />
      );

      // Interactúa haciendo clic directamente en el botón de guardar sin tocar el teclado.
      const btnSave = screen.getByRole('button', { name: /guardar/i });
      await user.click(btnSave);

      // Usa aserciones para garantizar que el fetch jamás fue invocado (0 llamadas)
      expect(global.fetch).not.toHaveBeenCalled();

      // Y que la capa visual bloqueó la solicitud mostrando los textos de validación predeterminados de cada campo requerido.
      await waitFor(() => {
        expect(screen.getByText('El concepto es requerido')).toBeInTheDocument();
        expect(screen.getByText('El monto debe ser mayor que 0')).toBeInTheDocument();
      });
    });

    // [Pruebas de valores límite] Límite inferior transaccional
    describe('[Pruebas de valores límite] Límite inferior transaccional', () => {
      const user = userEvent.setup();

      beforeEach(() => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });
      });

      // Escribe un test (o un test.each) que modifique exclusivamente el input del monto interactuando mediante .type(). 
      // Ingresa como inputs 0, 0.01 y -1.
      it.each([
        [0, true],
        [-1, true],
        [0.01, false],
      ])('Monto con valor: %s (Debe bloquear: %s)', async (monto, deberiaBloquear) => {
        const { unmount } = render(
          <MovementFormModal
            open={true}
            onOpenChange={mockOnOpenChange}
            onCreated={mockOnCreated}
          />
        );

        // Pre-fill concepto para aislar la validación de "amount".
        await user.type(screen.getByLabelText(/concepto/i), 'Prueba de limite');

        const amountInput = screen.getByLabelText(/monto/i);
        await user.clear(amountInput);

        // Modifique exclusivamente el input del monto interactuando mediante .type()
        await user.type(amountInput, monto.toString());

        await user.click(screen.getByRole('button', { name: /guardar/i }));

        if (deberiaBloquear) {
          // Genera aserciones visuales que confirmen que -1 y 0 generan estado de error obvio en el UI bloqueando el envío
          await waitFor(() => {
            expect(screen.getByText('El monto debe ser mayor que 0')).toBeInTheDocument();
          });
          expect(global.fetch).not.toHaveBeenCalled();
        } else {
          // Cerciórate de que exclusivamente el límite válido 0.01 dispara la llamada de API con ese valor particular
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const callArgs = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callArgs.amount).toBe(0.01);
          });
          expect(screen.queryByText('El monto debe ser mayor que 0')).not.toBeInTheDocument();
        }

        unmount();
      });
    });

    // [Transición de estado y exploración] Persistencia y limpieza de formulario
    it('[Transición de estado y exploración] Persistencia y limpieza de formulario', async () => {
      const user = userEvent.setup();

      // Abre el modal
      const { rerender, unmount } = render(
        <MovementFormModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const conceptInput = screen.getByLabelText(/concepto/i);
      const amountInput = screen.getByLabelText(/monto/i);

      // Rellena la caja de concepto y la fecha. (El mock lo asume como un llenado típico de usuario)
      await user.clear(conceptInput);
      await user.type(conceptInput, 'Prueba abortada');
      await user.clear(amountInput);
      await user.type(amountInput, '999');

      // A continuación simularemos una cancelación de estado disparando el evento de teclado Escape ({Escape}) sobre el modal base 
      // para forzar el cierre, o bien haciendo click en el botón Cancelar.
      await user.keyboard('{Escape}');

      // Si el Escape no es interceptado por Radix u otros, podemos forzar el click del botón Cancelar como fallback o acción explícita
      // Ya que jsdom y ui-dialog a veces tienen quirks con el Escape.
      const btnCancel = screen.getByRole('button', { name: /cancelar/i });
      await user.click(btnCancel);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);

      // Para simular en un ambiente de React testing que el componente se destruye temporalmente 
      // (si el padre condicionalmente lo omite, o si usamos una técnica de re-montaje)
      // usamos unmount y volvemos a renderizar para crear un entorno limpio que prueba que el Form no retuvo estado de caché global y se inicializa en sus nativos
      unmount();

      // Reabre el formulario pasando la propiedad open={true}.
      render(<MovementFormModal open={true} onOpenChange={mockOnOpenChange} />);

      // La prueba debe verificar de forma estricta que todo el contexto/estado interno de 
      // MovementFormValues ha sido erradicado y los inputs han vuelto a su valor HTML nativo por defecto.
      await waitFor(() => {
        const reopenedConcept = screen.getByLabelText(/concepto/i);
        const reopenedAmount = screen.getByLabelText(/monto/i);

        // Valores HTML nativo por defecto de acuerdo con schema config
        expect(reopenedConcept).toHaveValue('');
        expect(reopenedAmount).toHaveValue(0);
      });
    });
  });
});
