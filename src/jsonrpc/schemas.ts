import Ajv from 'ajv';
import merge from 'ajv-merge-patch';

const ajv = new Ajv();
merge(ajv);

export default ajv;
