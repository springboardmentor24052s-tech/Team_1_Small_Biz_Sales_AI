"""add products inventory and sales import keys

Revision ID: a90f3c21d6b8
Revises: 45275e0caf1f
Create Date: 2026-07-29 10:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a90f3c21d6b8"
down_revision: Union[str, None] = "45275e0caf1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("style", sa.String(length=100), nullable=True),
        sa.Column("size", sa.String(length=40), nullable=True),
        sa.Column("color", sa.String(length=80), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_products_tenant_id_tenants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("tenant_id", "sku", name="uq_products_tenant_sku"),
    )
    op.create_index(op.f("ix_products_category"), "products", ["category"], unique=False)
    op.create_index(op.f("ix_products_tenant_id"), "products", ["tenant_id"], unique=False)

    op.create_table(
        "inventory",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("store_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=False),
        sa.Column("reorder_level", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_inventory_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["store_id"],
            ["stores.id"],
            name=op.f("fk_inventory_store_id_stores"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_inventory_tenant_id_tenants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory")),
        sa.UniqueConstraint("store_id", "product_id", name="uq_inventory_store_product"),
    )
    op.create_index(
        op.f("ix_inventory_product_id"), "inventory", ["product_id"], unique=False
    )
    op.create_index(op.f("ix_inventory_store_id"), "inventory", ["store_id"], unique=False)
    op.create_index(op.f("ix_inventory_tenant_id"), "inventory", ["tenant_id"], unique=False)

    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.add_column(
            sa.Column(
                "source_system",
                sa.String(length=40),
                server_default="manual",
                nullable=False,
            )
        )
        batch_op.create_index(
            op.f("ix_sales_transactions_source_system"),
            ["source_system"],
            unique=False,
        )
        batch_op.create_unique_constraint(
            "uq_sales_transactions_import_key",
            ["tenant_id", "store_id", "source_system", "external_reference"],
        )


def downgrade() -> None:
    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.drop_constraint("uq_sales_transactions_import_key", type_="unique")
        batch_op.drop_index(op.f("ix_sales_transactions_source_system"))
        batch_op.drop_column("source_system")

    op.drop_index(op.f("ix_inventory_tenant_id"), table_name="inventory")
    op.drop_index(op.f("ix_inventory_store_id"), table_name="inventory")
    op.drop_index(op.f("ix_inventory_product_id"), table_name="inventory")
    op.drop_table("inventory")
    op.drop_index(op.f("ix_products_tenant_id"), table_name="products")
    op.drop_index(op.f("ix_products_category"), table_name="products")
    op.drop_table("products")
