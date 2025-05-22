import {
  Form,
  Button,
  Listbox,
  ListboxItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Checkbox,
  addToast,
} from '@heroui/react';
import { CirclePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useShallow } from 'zustand/shallow';

import { useIncome } from '../../hooks/use-income';
import { useForm } from '../../../../commons/ui/hooks/use-form';

export const IncomeAcordionBody = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();
  const { addIncome, incomes } = useIncome(
    useShallow(state => ({ incomes: state.incomes, addIncome: state.addIncome }))
  );

  const validateForm = z.object({
    name: z.string().min(4, 'El name es requerido'),
    value: z.string(),
    isDeductible: z.boolean(),
    description: z.string().optional(),
  });

  type AddIncomeFormValues = z.infer<typeof validateForm>;

  const { handleSubmit, handleChange, resetForm, errors, values } = useForm<AddIncomeFormValues>({
    initialValues: {
      name: '',
      value: '',
      isDeductible: false,
      description: '',
    },
    schema: validateForm,
    onSubmit: async values => {
      addIncome(values);
      resetForm();
      addToast({
        title: 'Income Added Succesfully',
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        color: 'success',
      });
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Listbox aria-label="Actions" onAction={key => alert(key)}>
        {Boolean(incomes.size) ? (
          Array.from(incomes.values()).map(({ id, name, value }) => (
            <ListboxItem key={`${id}`} textValue={`${name} - ${value}`}>
              {name} - {value}
            </ListboxItem>
          ))
        ) : (
          <></>
        )}
      </Listbox>

      <div>
        <Button isIconOnly className="w-full" aria-label="Add" color="primary" onPress={onOpen}>
          <CirclePlus />
        </Button>
      </div>

      <Modal isOpen={isOpen} placement="auto" onClose={handleClose}>
        <ModalContent>
          {onClose => (
            <Form className="items-stretch" onReset={resetForm} onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">New Income</ModalHeader>
              <ModalBody>
                <div className="w-full flex flex-col gap-4">
                  <Input
                    isRequired
                    errorMessage={errors.name}
                    label="Name"
                    name="name"
                    placeholder="Income name"
                    type="text"
                    onChange={handleChange('name')}
                    value={values.name}
                  />
                  <Input
                    isRequired
                    errorMessage="Please enter a valid value"
                    label="Value"
                    name="value"
                    placeholder="Enter the value"
                    type="text"
                    className="w-full"
                    onChange={handleChange('value')}
                    value={values.value}
                  />
                  <Textarea
                    className="w-full"
                    label="Description"
                    placeholder="Enter your description"
                    name="description"
                    onChange={handleChange('description')}
                    value={values.description}
                  />
                  <Checkbox color="primary" onChange={handleChange('isDeductible')} isSelected={values.isDeductible}>
                    Is it deductible?
                  </Checkbox>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" type="reset" variant="light" onPress={onClose}>
                  {t('commons.cancel')}
                </Button>
                <Button color="primary" type="submit">
                  {t('commons.add')}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
