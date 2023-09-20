import { isUndefined } from 'lodash/fp';
import { yup } from '@strapi/utils';
import { Attribute, Schema } from '@strapi/types';
import { typeKinds, coreUids } from '../../services/constants';
import { CommonTestConfig, isValidName } from './common';

const STRAPI_USER_RELATIONS = ['oneToOne', 'oneToMany'];

const isValidRelation = (validNatures: string[]) =>
  function (value: string) {
    if (this.parent.target === coreUids.STRAPI_USER) {
      if (!validNatures.includes(value) || !isUndefined(this.parent.targetAttribute)) {
        return this.createError({
          path: this.path,
          message: `must be one of the following values: ${STRAPI_USER_RELATIONS.join(', ')}`,
        });
      }
    }

    return validNatures.includes(value)
      ? true
      : this.createError({
          path: this.path,
          message: `must be one of the following values: ${validNatures.join(', ')}`,
        });
  };

export const getRelationValidator = (
  attribute: Attribute.Relation,
  allowedRelations: Record<string, Attribute.Relation>
) => {
  const contentTypesUIDs = Object.keys(strapi.contentTypes)
    .filter((key) => strapi.contentTypes[key as any].kind === typeKinds.COLLECTION_TYPE)
    .filter((key) => !key.startsWith(coreUids.PREFIX) || key === coreUids.STRAPI_USER)
    .concat(['__self__', '__contentType__']);

  const base = {
    type: yup.string().oneOf(['relation']).required(),
    relation: yup.string().test('isValidRelation', isValidRelation(allowedRelations)).required(),
    configurable: yup.boolean().nullable(),
    private: yup.boolean().nullable(),
    pluginOptions: yup.object(),
  };

  switch (attribute.relation) {
    case 'oneToOne':
    case 'oneToMany':
    case 'manyToOne':
    case 'manyToMany':
    case 'morphOne':
    case 'morphMany': {
      return yup.object({
        ...base,
        target: yup.string().oneOf(contentTypesUIDs).required(),
        targetAttribute: yup.string().test(isValidName).nullable(),
      });
    }
    case 'morphToOne':
    case 'morphToMany':
    default: {
      return yup.object({ ...base });
    }
  }
};