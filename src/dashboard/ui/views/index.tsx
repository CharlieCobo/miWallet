import Acordion from '../../../commons/ui/components/acordion';
import { useIncome } from '../../../commons/ui/hooks/use-income';

export default () => {
  const addIncome = useIncome(state => state.addIncome);

  return (
    <>
      <Acordion />
      <button onClick={() => addIncome({ name: 'test', value: '100' })}>Add Income</button>
    </>
  );
};
