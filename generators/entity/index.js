/* eslint-disable consistent-return */
const chalk = require('chalk');
const EntityGenerator = require('generator-jhipster/generators/entity');
// eslint-disable-next-line import/no-extraneous-dependencies
const toPascalCase = require('to-pascal-case');
const pluralize = require('pluralize');
const _ = require('lodash');
const utilsNet = require('../utils');
const constants = require('../generator-dotnetcore-constants');
const prompts = require('./prompts');
const asModel = require('../utils').asModel;

module.exports = class extends EntityGenerator {
    constructor(args, opts) {
        super(args, { fromBlueprint: true, ...opts }); // fromBlueprint variable is important

        const jhContext = (this.jhipsterContext = this.options.jhipsterContext);

        if (!jhContext) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint dotnetcore')}`);
        }

        this.configOptions = jhContext.configOptions || {};
        // This sets up options for this sub generator and is being reused from JHipster
        jhContext.setupEntityOptions(this, jhContext);
    }

    get initializing() {
        const phaseFromJHipster = super._initializing();
        const jhipsterNetPhaseSteps = {
            getConfigNetBlueprint() {
                const configuration = this.getAllJhipsterConfig(this, true);
                this.context.namespace = configuration.get('namespace') || this.configOptions.namespace;
                this.context.dtoSuffix = 'Dto';
            },
        };
        return Object.assign(phaseFromJHipster, jhipsterNetPhaseSteps);
    }

    get prompting() {
        return {
            /* pre entity hook needs to be written here */
            askForMicroserviceJson: prompts.askForMicroserviceJson,
            /* ask question to user if s/he wants to update entity */
            askForUpdate: prompts.askForUpdate,
            askForFields: prompts.askForFields,
            askForFieldsToRemove: prompts.askForFieldsToRemove,
            askForRelationships: prompts.askForRelationships,
            askForRelationsToRemove: prompts.askForRelationsToRemove,
            askForTableName: prompts.askForTableName,
            askForService: prompts.askForService,
            askForDTO: prompts.askForDTO,
            // askForFiltering: prompts.askForFiltering,
            askForPagination: prompts.askForPagination,
        };
    }

    get configuring() {
        const phaseFromJHipster = super._configuring();
        const jhipsterNetPhaseSteps = {
            loadInMemoryDataNetBlueprint() {
                const context = this.context;
                context.pascalizedBaseName = toPascalCase(context.baseName);
                context.mainProjectDir = context.pascalizedBaseName;
                context.testProjectDir = `${context.pascalizedBaseName}${constants.PROJECT_TEST_SUFFIX}`;
                context.pascalizedEntityClass = toPascalCase(context.entityClass);
                context.pascalizedEntityClassPlural = toPascalCase(context.entityClassPlural);
                context.snakeCasedEntityClass = _.snakeCase(context.entityClass);
                context.snakeCasedEntityClassPlural = _.snakeCase(context.entityClassPlural);
                context.camelCasedEntityClass = _.camelCase(context.entityClass);
                context.camelCasedEntityClassPlural = _.camelCase(context.entityClassPlural);
                context.kebabCasedEntityClass = _.kebabCase(context.entityClass);
                context.kebabCasedEntityClassPlural = _.kebabCase(context.entityClassPlural);
                context.lowerCasedEntityClass = _.toLower(context.entityClass);
                context.lowerCasedEntityClassPlural = _.toLower(context.entityClassPlural);
                context.entityClassHasManyToMany = false;
                context.entities = this.getExistingEntities();
                // Add context.allEntities to make it easier working with templates that require fields/relationships from all entities
                context.allEntities = [];
                context.mainClientAppDir = `${context.mainProjectDir}/ClientApp/src`;
                context.mainClientDir = `${context.mainProjectDir}/ClientApp`;

                // Embed functions to use in EJS templates
                context.toPascalCase = toPascalCase;
                context.pluralize = pluralize;
                context._ = _;
                context.equivalentCSharpType = utilsNet.equivalentCSharpType;
                context.asModel = asModel;

                // Load in-memory data for .Net Blueprint fields
                context.fields.forEach(field => {
                    loadFieldData(field);

                    if (field.fieldIsEnum === true) {
                        context.i18nToLoad.push(field.enumInstance);
                    }
                });

                // Load in-memory data for .Net Blueprint relationships
                // for the current entity being added/modified/regenerated.
                context.relationships.forEach(relationship => {
                    loadRelationshipData(relationship);
                    if (relationship.relationshipType === 'many-to-many') {
                        context.entityClassHasManyToMany = true;
                    }
                });

                // Load in-memory data for existing entities
                context.entities.forEach(entity => {
                    entity.definition.fields.forEach(field => {
                        loadFieldData(field);
                    });

                    entity.definition.relationships.forEach(relationship => {
                        loadRelationshipData(relationship);
                    });

                    context.allEntities.push({
                        name: entity.name,
                        relationships: entity.definition.relationships,
                        fields: entity.definition.fields,
                    });
                });

                // checks if the current entity is new (not exists in context.entities) and adds it to allEntities
                if (!context.entities.some(entity => entity.name === context.entityClass)) {
                    context.allEntities.push({
                        name: context.entityClass,
                        relationships: context.relationships,
                        fields: context.fields,
                    });
                }
            },
        };
        return Object.assign(phaseFromJHipster, jhipsterNetPhaseSteps);
    }

    get writing() {
        return super._writing();
    }

    get install() {
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._install();
    }
};

function loadFieldData(field) {
    field.fieldNamePascalized = toPascalCase(field.fieldName);
    field.fieldNameCamelCased = _.camelCase(field.fieldName);

    const fieldType = field.fieldType;

    field.fieldIsEnum = ![
        'String',
        'Integer',
        'Long',
        'Float',
        'Double',
        'BigDecimal',
        'LocalDate',
        'Instant',
        'ZonedDateTime',
        'Duration',
        'UUID',
        'Boolean',
        'byte[]',
        'ByteBuffer',
    ].includes(fieldType);
}

function loadRelationshipData(relationship) {
    relationship.relationshipNamePascalized = toPascalCase(relationship.relationshipName);
    relationship.relationshipNamePascalizedPlural = pluralize(relationship.relationshipNamePascalized);
    if (relationship.relationshipFieldName) {
        relationship.relationshipFieldNamePascalized = toPascalCase(relationship.relationshipFieldName);
        relationship.relationshipFieldNamePascalizedPlural = pluralize(relationship.relationshipFieldNamePascalized);
    } else {
        relationship.relationshipFieldNamePascalized = toPascalCase(relationship.relationshipName);
        relationship.relationshipFieldNamePascalizedPlural = pluralize(relationship.relationshipFieldNamePascalized);
    }
    relationship.otherEntityNamePascalized = toPascalCase(relationship.otherEntityName);
    if (!relationship.otherEntityNamePlural) {
        relationship.otherEntityNamePlural = pluralize(relationship.otherEntityName);
    }
    relationship.otherEntityNamePascalizedPlural = toPascalCase(relationship.otherEntityNamePlural);
    relationship.otherEntityNameCamelCased = _.camelCase(relationship.otherEntityName);
    relationship.otherEntityNameLowerCased = _.toLower(relationship.otherEntityName);
    relationship.otherEntityNameLowerCasedPlural = _.toLower(relationship.otherEntityNamePlural);

    if (
        relationship.relationshipType === 'one-to-many' ||
        relationship.relationshipType === 'many-to-many' ||
        relationship.relationshipType === 'one-to-one' ||
        relationship.otherEntityName.toLowerCase() === 'user'
    ) {
        relationship.otherEntityRelationshipNamePascalized = toPascalCase(relationship.otherEntityRelationshipName);
        relationship.otherEntityRelationshipFieldName = _.lowerFirst(relationship.otherEntityRelationshipName);
        relationship.otherEntityRelationshipFieldNamePascalized = toPascalCase(relationship.otherEntityRelationshipFieldName);
        relationship.otherEntityRelationshipFieldNamePascalizedPlural = pluralize(relationship.otherEntityRelationshipFieldNamePascalized);
    }

    if (relationship.relationshipType === 'many-to-many') {
        if (relationship.ownerSide) {
            relationship.otherEntityRelationshipNamePascalizedPlural = pluralize(relationship.otherEntityRelationshipNamePascalized);
            relationship.joinEntityName = relationship.otherEntityRelationshipName + _.upperFirst(relationship.relationshipName);
            relationship.joinEntityNamePascalized =
                relationship.otherEntityRelationshipNamePascalized + relationship.relationshipNamePascalized;
        } else {
            relationship.joinEntityName = relationship.relationshipName + _.upperFirst(relationship.otherEntityRelationshipName);
            relationship.joinEntityNamePascalized =
                relationship.relationshipNamePascalized + relationship.otherEntityRelationshipNamePascalized;
        }
        relationship.joinEntityNameSnakeCased = _.snakeCase(relationship.joinEntityName);
        relationship.joinEntityNameCamelCased = _.camelCase(relationship.joinEntityName);
        relationship.joinEntityFieldNamePascalizedPlural = pluralize(relationship.joinEntityNamePascalized);
    }

    relationship.joinEntityGenerated = false;
}
